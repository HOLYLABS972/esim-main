import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    console.log('🔄 Starting Airalo sync...');
    
    // Get Airalo credentials from Firestore
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloConfig = await getDoc(airaloConfigRef);
    
    if (!airaloConfig.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Airalo configuration not found. Please set up Airalo credentials in the admin panel.'
      }, { status: 400 });
    }
    
    const configData = airaloConfig.data();
    const clientId = configData.api_key; // Use api_key field
    const environment = configData.environment || 'sandbox';
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Airalo API key not found. Please set it in the admin panel.'
      }, { status: 400 });
    }
    
    console.log(`🔧 Using Airalo API in ${environment.toUpperCase()} mode`);
    
    // Get client secret from environment variables based on environment
    const clientSecret = environment === 'production' 
      ? process.env.AIRALO_CLIENT_SECRET_PRODUCTION 
      : process.env.AIRALO_CLIENT_SECRET_SANDBOX;
      
    console.log(`🔑 Client Secret loaded: ${clientSecret ? 'YES' : 'NO'} (${clientSecret ? clientSecret.substring(0, 10) + '...' : 'undefined'})`);
    
    if (!clientSecret) {
      return NextResponse.json({
        success: false,
        error: `Airalo ${environment.toUpperCase()} client secret not found in environment variables. Please add AIRALO_CLIENT_SECRET_SANDBOX and AIRALO_CLIENT_SECRET_PRODUCTION to your .env.local file.`
      }, { status: 400 });
    }
    
    // Use correct API URL based on environment
    const baseUrl = environment === 'production' 
      ? 'https://partners-api.airalo.com' 
      : 'https://sandbox-partners-api.airalo.com';
    
    console.log(`🌐 Using API URL: ${baseUrl}`);
    
    // Authenticate with Airalo API
    console.log(`🔐 Attempting authentication with client_id: ${clientId.substring(0, 10)}...`);
    const authResponse = await fetch(`${baseUrl}/v2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });
    
    console.log(`🔐 Auth response status: ${authResponse.status} ${authResponse.statusText}`);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log(`🔐 Auth error response: ${errorText}`);
      
      // Check if account is terminated and offer mock data option
      if (errorText.includes('account is terminated')) {
        console.log('🔄 Account terminated, offering mock data option...');
        return NextResponse.json({
          success: false,
          error: 'Airalo account terminated. Please get new credentials or use mock data for testing.',
          mock_data_available: true,
          message: 'Your Airalo account has been terminated. You can either get new credentials from https://partners.airalo.com/ or use mock data for testing the admin dashboard.'
        }, { status: 400 });
      }
      
      throw new Error(`Authentication failed: ${authResponse.statusText} - ${errorText}`);
    }
    
    const authData = await authResponse.json();
    const accessToken = authData.data?.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received from Airalo API');
    }
    
    console.log('✅ Successfully authenticated with Airalo API');
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    let totalSynced = { countries: 0, packages: 0 };
    
    // Fetch and sync countries
    try {
      console.log('🌍 Fetching countries from Airalo API...');
      const countriesResponse = await fetch(`${baseUrl}/v2/countries`, {
        headers
      });
      
      if (!countriesResponse.ok) {
        throw new Error(`Failed to fetch countries: ${countriesResponse.statusText}`);
      }
      
      const countriesData = await countriesResponse.json();
      const countries = countriesData.data || [];
      
      // Batch write countries to Firestore
      const batch = [];
      for (const country of countries) {
        if (country.code && country.name) {
          const countryRef = doc(db, 'countries', country.code);
          batch.push(setDoc(countryRef, {
            name: country.name,
            code: country.code,
            flag: country.flag || '',
            region_slug: country.region_slug || '',
            is_roaming: country.is_roaming || false,
            status: 'active',
            updated_at: serverTimestamp(),
            updated_by: 'airalo_sync',
            provider: 'airalo'
          }, { merge: true }));
          totalSynced.countries++;
        }
      }
      
      // Execute batch
      await Promise.all(batch);
      console.log(`✅ Synced ${totalSynced.countries} countries`);
      
    } catch (error) {
      console.error('❌ Error syncing countries:', error);
      return NextResponse.json({
        success: false,
        error: `Error syncing countries: ${error.message}`
      }, { status: 500 });
    }
    
    // Fetch and sync packages
    try {
      console.log('📱 Fetching packages from Airalo API...');
      const packagesResponse = await fetch(`${baseUrl}/v2/packages`, {
        headers
      });
      
      if (!packagesResponse.ok) {
        throw new Error(`Failed to fetch packages: ${packagesResponse.statusText}`);
      }
      
      const packagesData = await packagesResponse.json();
      const packages = packagesData.data || [];
      
      // Batch write packages to Firestore
      const batch = [];
      for (const pkg of packages) {
        if (pkg.slug && pkg.name) {
          const packageRef = doc(db, 'packages', pkg.slug);
          batch.push(setDoc(packageRef, {
            name: pkg.name,
            slug: pkg.slug,
            description: pkg.description || '',
            data_amount: pkg.data_amount || 0,
            data_unit: pkg.data_unit || 'GB',
            validity: pkg.validity || 0,
            validity_unit: pkg.validity_unit || 'days',
            price: pkg.price || 0,
            currency: pkg.currency || 'USD',
            country_code: pkg.country_code || '',
            region_slug: pkg.region_slug || '',
            status: 'active',
            updated_at: serverTimestamp(),
            updated_by: 'airalo_sync',
            provider: 'airalo'
          }, { merge: true }));
          totalSynced.packages++;
        }
      }
      
      // Execute batch
      await Promise.all(batch);
      console.log(`✅ Synced ${totalSynced.packages} packages`);
      
    } catch (error) {
      console.error('❌ Error syncing packages:', error);
      // Don't return error here, just log it and continue
    }
    
    // Create sync log
    const logRef = doc(collection(db, 'sync_logs'));
    await setDoc(logRef, {
      timestamp: serverTimestamp(),
      countries_synced: totalSynced.countries,
      packages_synced: totalSynced.packages,
      status: 'completed',
      source: 'admin_manual_sync',
      sync_type: `complete_sync_${environment}`,
      provider: 'airalo'
    });
    
    const totalItems = totalSynced.countries + totalSynced.packages;
    console.log(`🎉 Successfully synced all data: ${totalItems} total items`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced all data from Airalo ${environment.toUpperCase()} API`,
      total_synced: totalItems,
      details: totalSynced
    });
    
  } catch (error) {
    console.error('❌ Error in sync-airalo API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
