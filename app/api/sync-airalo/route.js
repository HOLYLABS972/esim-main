import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function POST() {
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
    
    // Get markup percentage from configuration (default to 17%)
    const markupConfigRef = doc(db, 'config', 'pricing');
    const markupConfig = await getDoc(markupConfigRef);
    const markupPercentage = markupConfig.exists() ? (markupConfig.data().markup_percentage || 17) : 17;
    
    console.log(`💰 Using markup percentage: ${markupPercentage}%`);
    
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
    
    // Fetch and sync packages (which include country data) with pagination
    try {
      console.log('📱 Fetching packages from Airalo API...');
      
      // Function to fetch all pages
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
      
      // Extract all packages and countries from all plans
      const allPackages = [];
      const countriesMap = new Map();
      
      // Look for plans that have packages (these are the actual plans with pricing data)
      const plansWithPackages = plans.filter(p => p.packages && Array.isArray(p.packages));
      
      // Also look for plans that have operators with packages
      const plansWithOperators = plans.filter(p => p.operators && Array.isArray(p.operators));
      
      // Process plans with direct packages
      for (const plan of plansWithPackages) {
        // Extract packages from this plan
        for (const pkg of plan.packages) {
          allPackages.push({
            ...pkg,
            plan_title: plan.title,
            plan_id: plan.id,
            // Add country codes from the plan's countries
            country_codes: plan.countries ? plan.countries.map(c => c.country_code).filter(Boolean) : []
          });
        }
        
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
      
      // Process plans with operators (the actual structure we're getting)
      for (const plan of plansWithOperators) {
        for (const operator of plan.operators) {
          // Extract packages from this operator
          if (operator.packages && Array.isArray(operator.packages)) {
            for (const pkg of operator.packages) {
              allPackages.push({
                ...pkg,
                plan_title: operator.title,
                plan_id: operator.id,
                // Add country codes from the plan's country_code
                country_codes: [plan.country_code].filter(Boolean)
              });
            }
          }
          
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
      
      // Also process individual country entries (these are just country listings)
      for (const plan of plans) {
        // Handle individual country entries (like "United States", "France", etc.)
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
      
      console.log(`📦 Extracted ${allPackages.length} packages`);
      
      // Skip countries sync - keep existing countries
      console.log(`🌍 Skipping countries sync - keeping existing countries (${countriesMap.size} countries found in API)`);
      
      // Process plans (save as plans, not packages)
      const plansBatch = [];
      
      // If we have packages, process them as individual plans
      if (allPackages.length > 0) {
        for (const pkg of allPackages) {
          if (pkg.id && pkg.title) {
            const planRef = doc(db, 'dataplans', pkg.id);
            
            // Use country codes from the package (already extracted)
            const countryCodes = pkg.country_codes || [];
            
            // Calculate retail price with markup
            const originalPrice = parseFloat(pkg.price) || 0;
            const retailPrice = Math.round(originalPrice * (1 + markupPercentage / 100));
            
            plansBatch.push(setDoc(planRef, {
              slug: pkg.id,
              name: pkg.title,
              description: pkg.short_info || '',
              price: retailPrice, // Store retail price (with markup)
              original_price: originalPrice, // Store original price for reference
              currency: 'USD',
              country_codes: countryCodes,
              country_ids: countryCodes, // For compatibility
              capacity: pkg.amount || 0,
              period: pkg.day || 0,
              operator: pkg.operator || '',
              status: 'active',
              updated_at: serverTimestamp(),
              synced_at: new Date().toISOString(),
              updated_by: 'airalo_sync',
              provider: 'airalo',
              // Additional fields from Airalo API
              is_roaming: pkg.is_roaming || false,
              data: pkg.data || '',
              voice: pkg.voice || null,
              text: pkg.text || null,
              net_price: pkg.net_price || 0,
              prices: pkg.prices || {}
            }, { merge: true }));
            totalSynced.packages++;
          }
        }
      } else {
        // Fallback: process original plans structure
        for (const plan of plans) {
          if (plan.id && plan.title) {
            const planRef = doc(db, 'dataplans', plan.id);
            
            // Extract country codes from plan countries
            const countryCodes = plan.countries ? plan.countries.map(c => c.country_code).filter(Boolean) : [];
            
            // Calculate minimum price from packages
            let minPrice = 0;
            if (plan.packages && plan.packages.length > 0) {
              const prices = plan.packages.map(pkg => parseFloat(pkg.price) || 0).filter(price => price > 0);
              minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            }
            
            plansBatch.push(setDoc(planRef, {
              slug: plan.id,
              name: plan.title,
              description: plan.short_info || '',
              price: minPrice, // Use minimum price from packages
              currency: 'USD',
              country_codes: countryCodes,
              country_ids: countryCodes, // For compatibility
              capacity: plan.packages && plan.packages.length > 0 ? 
                (plan.packages[0].amount || 0) : 0,
              period: plan.packages && plan.packages.length > 0 ? 
                (plan.packages[0].day || 0) : 0,
              operator: plan.operator || '',
              status: 'active',
              updated_at: serverTimestamp(),
              synced_at: new Date().toISOString(),
              updated_by: 'airalo_sync',
              provider: 'airalo',
              // Additional fields from Airalo API
              is_roaming: plan.is_roaming || false,
              packages: plan.packages || [],
              countries: plan.countries || []
            }, { merge: true }));
            totalSynced.packages++;
          }
        }
      }
      
      // Execute plans batch
      await Promise.all(plansBatch);
      console.log(`✅ Synced ${totalSynced.packages} plans`);
      
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
      countries_synced: 0, // Countries sync disabled
      plans_synced: totalSynced.packages,
      status: 'completed',
      source: 'admin_manual_sync',
      sync_type: 'plans_only_sync',
      provider: 'airalo',
      note: 'Countries sync disabled - keeping existing countries'
    });
    
    const totalItems = totalSynced.packages; // Only count plans since countries are skipped
    console.log(`🎉 Successfully synced plans: ${totalItems} plans (countries skipped)`);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully synced plans from Airalo API (countries preserved)',
      total_synced: totalItems,
      plans: [], // Empty array since plans are saved directly to Firestore
      countries: [], // Empty array since countries sync is disabled
      details: {
        plans_synced: totalSynced.packages,
        countries_synced: 0,
        note: 'Countries sync disabled - existing countries preserved'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in sync-airalo API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
