import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST() {
  try {
    console.log('🌍 Starting countries sync from Airalo API...');
    
    // Get Airalo credentials from Firestore
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloConfig = await airaloConfigRef.get();
    
    if (!airaloConfig.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Airalo configuration not found. Please set up Airalo credentials in the admin panel.'
      }, { status: 400 });
    }
    
    const configData = airaloConfig.data();
    const clientId = configData.api_key;
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Airalo API key not found. Please set it in the admin panel.'
      }, { status: 400 });
    }
    
    // Get client secret from environment variables
    const clientSecret = process.env.AIRALO_CLIENT_SECRET_PRODUCTION;
    
    if (!clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Airalo client secret not found in environment variables.'
      }, { status: 400 });
    }
    
    const baseUrl = 'https://partners-api.airalo.com';
    
    // Authenticate with Airalo API
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
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
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
    
    // Use the same packages API as plans sync to get countries data
    console.log('🌍 Fetching packages from Airalo API to extract countries...');
    
    // Function to fetch all pages (same as plans sync)
    const fetchAllPages = async () => {
      let allPlans = [];
      let currentPage = 1;
      let hasNextPage = true;
      
      while (hasNextPage) {
        const packagesResponse = await fetch(`${baseUrl}/v2/packages?page=${currentPage}`, {
          headers
        });
        
        if (!packagesResponse.ok) {
          throw new Error(`Failed to fetch packages page ${currentPage}: ${packagesResponse.statusText}`);
        }
        
        const packagesData = await packagesResponse.json();
        
        if (packagesData.data && Array.isArray(packagesData.data)) {
          allPlans = allPlans.concat(packagesData.data);
        }
        
        // Check if there's a next page
        hasNextPage = packagesData.links && packagesData.links.next;
        currentPage++;
        
        // Safety check to prevent infinite loops
        if (currentPage > 50) {
          break;
        }
      }
      
      return allPlans;
    };
    
    const packagesData = await fetchAllPages();
    const plans = packagesData;
    
    console.log(`📊 Received ${plans.length} plans from API`);
    
    // Extract countries from plans (same logic as plans sync but only save countries)
    const countriesMap = new Map();
    
    // Look for plans that have packages
    const plansWithPackages = plans.filter(p => p.packages && Array.isArray(p.packages));
    
    // Also look for plans that have operators with packages
    const plansWithOperators = plans.filter(p => p.operators && Array.isArray(p.operators));
    
    // Process plans with direct packages
    for (const plan of plansWithPackages) {
      // Extract countries from this plan
      if (plan.countries && Array.isArray(plan.countries)) {
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
    
    // Process plans with operators
    for (const plan of plansWithOperators) {
      for (const operator of plan.operators) {
        // Extract countries from this operator
        if (operator.countries && Array.isArray(operator.countries)) {
          for (const country of operator.countries) {
            countriesMap.set(country.country_code, {
              code: country.country_code,
              name: country.title,
              flag: country.image?.url || '',
              region_slug: '', // Not provided in this structure
              is_roaming: operator.is_roaming || false
            });
          }
        }
      }
    }
    
    // Also process individual country entries
    for (const plan of plans) {
      // Handle individual country entries
      if (plan.country_code && plan.title && !plan.packages && !plan.countries) {
        // Add to countries map if not already present
        if (!countriesMap.has(plan.country_code)) {
          countriesMap.set(plan.country_code, {
            code: plan.country_code,
            name: plan.title,
            flag: plan.image?.url || '',
            region_slug: '',
            is_roaming: false
          });
        }
      }
    }
    
    console.log(`🌍 Extracted ${countriesMap.size} countries from packages data`);
    
    // Process and save countries
    const countriesBatch = [];
    let totalSynced = 0;
    
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
      totalSynced++;
    }
    
    // Execute countries batch
    await Promise.all(countriesBatch);
    console.log(`✅ Synced ${totalSynced} countries`);
    
    // Create sync log
    const logRef = doc(collection(db, 'sync_logs'));
    await setDoc(logRef, {
      timestamp: serverTimestamp(),
      countries_synced: totalSynced,
      plans_synced: 0,
      status: 'completed',
      source: 'admin_manual_sync',
      sync_type: 'countries_only_sync',
      provider: 'airalo'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully synced countries from Airalo API',
      total_synced: totalSynced,
      countries: [], // Empty array since countries are saved directly to Firestore
      details: {
        countries_synced: totalSynced,
        plans_synced: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error in sync-countries API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
