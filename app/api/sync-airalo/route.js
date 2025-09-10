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
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Airalo API key not found. Please set it in the admin panel.'
      }, { status: 400 });
    }
    
    console.log(`🔧 Using Airalo API with client ID: ${clientId.substring(0, 10)}...`);
    
    // Get client secret from environment variables
    const clientSecret = process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
      
    console.log(`🔑 Client Secret loaded: ${clientSecret ? 'YES' : 'NO'} (${clientSecret ? clientSecret.substring(0, 10) + '...' : 'undefined'})`);
    
    if (!clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Airalo client secret not found in environment variables. Please add AIRALO_CLIENT_SECRET_PRODUCTION to your Vercel environment variables.'
      }, { status: 400 });
    }
    
    // Use production API URL for both sandbox and production (Airalo's new structure)
    const baseUrl = 'https://partners-api.airalo.com';
    
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
    
    // Fetch and sync packages (which include country data)
    try {
      console.log('📱 Fetching packages from Airalo API...');
      const packagesResponse = await fetch(`${baseUrl}/v2/packages`, {
        headers
      });
      
      if (!packagesResponse.ok) {
        throw new Error(`Failed to fetch packages: ${packagesResponse.statusText}`);
      }
      
      const packagesData = await packagesResponse.json();
      const plans = packagesData.data || [];
      
      console.log(`📊 Received ${plans.length} plans from API`);
      
      // Debug: Check the structure of the first plan
      if (plans.length > 0) {
        console.log('🔍 First plan structure:', JSON.stringify(plans[0], null, 2));
        console.log('🔍 Plan keys:', Object.keys(plans[0]));
        if (plans[0].packages) {
          console.log('📦 First plan has packages:', plans[0].packages.length);
        }
        if (plans[0].countries) {
          console.log('🌍 First plan has countries:', plans[0].countries.length);
        }
      }
      
      // Extract all packages and countries from all plans
      const allPackages = [];
      const countriesMap = new Map();
      
      for (const plan of plans) {
        // Extract packages from this plan
        if (plan.packages && Array.isArray(plan.packages)) {
          console.log(`📦 Plan "${plan.title}" has ${plan.packages.length} packages`);
          for (const pkg of plan.packages) {
            allPackages.push({
              ...pkg,
              plan_title: plan.title,
              plan_id: plan.id
            });
          }
        }
        
        // Extract countries from this plan
        if (plan.countries && Array.isArray(plan.countries)) {
          console.log(`🌍 Plan "${plan.title}" has ${plan.countries.length} countries`);
          for (const country of plan.countries) {
            countriesMap.set(country.country_code, {
              code: country.country_code,
              name: country.title,
              flag: country.image?.url || '',
              region_slug: '', // Not provided in this structure
              is_roaming: plan.is_roaming || false
            });
          }
        }
      }
      
      console.log(`📦 Total packages extracted: ${allPackages.length}`);
      console.log(`🌍 Total countries extracted: ${countriesMap.size}`);
      
      // Process countries
      const countriesBatch = [];
      for (const [code, country] of countriesMap) {
        const countryRef = doc(db, 'countries', code);
        countriesBatch.push(setDoc(countryRef, {
          name: country.name,
          code: country.code,
          flag: country.flag,
          region_slug: country.region_slug,
          is_roaming: country.is_roaming,
          status: 'active',
          updated_at: serverTimestamp(),
          updated_by: 'airalo_sync',
          provider: 'airalo'
        }, { merge: true }));
        totalSynced.countries++;
      }
      
      // Execute countries batch
      await Promise.all(countriesBatch);
      console.log(`✅ Synced ${totalSynced.countries} countries`);
      
      // Process packages
      const packagesBatch = [];
      for (const pkg of allPackages) {
        if (pkg.id && pkg.title) {
          const packageRef = doc(db, 'packages', pkg.id);
          packagesBatch.push(setDoc(packageRef, {
            name: pkg.title,
            slug: pkg.id,
            description: pkg.short_info || '',
            data_amount: pkg.amount || 0,
            data_unit: 'MB',
            validity: pkg.day || 0,
            validity_unit: 'days',
            price: pkg.price || 0,
            currency: 'USD',
            country_code: 'US', // From the data structure
            region_slug: '',
            status: 'active',
            updated_at: serverTimestamp(),
            updated_by: 'airalo_sync',
            provider: 'airalo',
            // Additional fields from Airalo API
            type: pkg.type || 'sim',
            net_price: pkg.net_price || 0,
            is_unlimited: pkg.is_unlimited || false,
            voice: pkg.voice || null,
            text: pkg.text || null,
            data: pkg.data || '',
            prices: pkg.prices || {},
            plan_title: pkg.plan_title,
            plan_id: pkg.plan_id
          }, { merge: true }));
          totalSynced.packages++;
        }
      }
      
      // Execute packages batch
      await Promise.all(packagesBatch);
      console.log(`✅ Synced ${totalSynced.packages} packages`);
      
    } catch (error) {
      console.error('❌ Error syncing packages:', error);
      return NextResponse.json({
        success: false,
        error: `Error syncing packages: ${error.message}`
      }, { status: 500 });
    }
    
    // Create sync log
    const logRef = doc(collection(db, 'sync_logs'));
    await setDoc(logRef, {
      timestamp: serverTimestamp(),
      countries_synced: totalSynced.countries,
      packages_synced: totalSynced.packages,
      status: 'completed',
      source: 'admin_manual_sync',
      sync_type: 'complete_sync',
      provider: 'airalo'
    });
    
    const totalItems = totalSynced.countries + totalSynced.packages;
    console.log(`🎉 Successfully synced all data: ${totalItems} total items`);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully synced all data from Airalo API',
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
