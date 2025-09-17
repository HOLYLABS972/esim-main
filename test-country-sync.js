#!/usr/bin/env node

/**
 * Test script to debug the Airalo country sync API
 * This will help identify why only 25 countries are being received
 */

const testCountrySync = async () => {
  console.log('🧪 Testing Airalo Country Sync API...\n');

  try {
    // Test the sync API endpoint
    console.log('📡 Making request to /api/sync-airalo...');
    
    const response = await fetch('http://localhost:3000/api/sync-airalo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📋 Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ Sync successful!`);
      console.log(`📈 Countries synced: ${data.details?.countries || 'N/A'}`);
      console.log(`📈 Plans synced: ${data.details?.packages || 'N/A'}`);
      console.log(`📈 Total synced: ${data.total_synced || 'N/A'}`);
    } else {
      console.log(`❌ Sync failed: ${data.error}`);
    }

  } catch (error) {
    console.error('❌ Error testing sync API:', error.message);
  }
};

// Alternative: Test with direct Airalo API call to compare
const testDirectAiraloAPI = async () => {
  console.log('\n🔍 Testing direct Airalo API call...\n');

  try {
    // You'll need to replace these with your actual credentials
    const clientId = 'your_client_id_here';
    const clientSecret = 'your_client_secret_here';

    if (clientId === 'your_client_id_here') {
      console.log('⚠️  Please update the client credentials in this script to test direct API');
      return;
    }

    // Step 1: Authenticate
    console.log('🔐 Authenticating with Airalo...');
    const authResponse = await fetch('https://partners-api.airalo.com/v2/token', {
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
      console.log(`❌ Auth failed: ${authResponse.status} ${errorText}`);
      return;
    }

    const authData = await authResponse.json();
    const accessToken = authData.data?.access_token;

    if (!accessToken) {
      console.log('❌ No access token received');
      return;
    }

    console.log('✅ Authentication successful');

    // Step 2: Fetch packages
    console.log('📱 Fetching packages...');
    const packagesResponse = await fetch('https://partners-api.airalo.com/v2/packages', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    });

    if (!packagesResponse.ok) {
      console.log(`❌ Packages fetch failed: ${packagesResponse.status}`);
      return;
    }

    const packagesData = await packagesResponse.json();
    
    console.log('📊 Raw API Response Structure:');
    console.log('- Response keys:', Object.keys(packagesData));
    console.log('- Data type:', typeof packagesData.data);
    console.log('- Data length:', packagesData.data?.length);
    
    if (packagesData.data && Array.isArray(packagesData.data)) {
      console.log('\n📋 First 3 items structure:');
      packagesData.data.slice(0, 3).forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          title: item.title,
          id: item.id,
          hasPackages: !!item.packages,
          hasCountries: !!item.countries,
          hasOperators: !!item.operators,
          countryCode: item.country_code,
          keys: Object.keys(item)
        });
      });

      // Count countries
      const countriesMap = new Map();
      
      packagesData.data.forEach(plan => {
        // From plan.countries
        if (plan.countries && Array.isArray(plan.countries)) {
          plan.countries.forEach(country => {
            if (country.country_code) {
              countriesMap.set(country.country_code, {
                name: country.title,
                code: country.country_code
              });
            }
          });
        }
        
        // From plan.operators
        if (plan.operators && Array.isArray(plan.operators)) {
          plan.operators.forEach(operator => {
            if (operator.countries && Array.isArray(operator.countries)) {
              operator.countries.forEach(country => {
                if (country.country_code) {
                  countriesMap.set(country.country_code, {
                    name: country.title,
                    code: country.country_code
                  });
                }
              });
            }
          });
        }
        
        // From individual country entries
        if (plan.country_code && plan.title && !plan.packages && !plan.countries) {
          countriesMap.set(plan.country_code, {
            name: plan.title,
            code: plan.country_code
          });
        }
      });

      console.log(`\n🌍 Total unique countries found: ${countriesMap.size}`);
      console.log('📋 Countries list:', Array.from(countriesMap.values()).map(c => `${c.name} (${c.code})`));

    } else {
      console.log('❌ Unexpected data structure');
    }

  } catch (error) {
    console.error('❌ Error testing direct API:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting Airalo Country Sync Debug Test\n');
  
  // Test 1: Our sync API
  await testCountrySync();
  
  // Test 2: Direct Airalo API (uncomment and add credentials to test)
  // await testDirectAiraloAPI();
  
  console.log('\n🏁 Test completed!');
  console.log('\n💡 To debug further:');
  console.log('1. Check the server logs when running the sync');
  console.log('2. Verify your Airalo credentials are correct');
  console.log('3. Check if there are any rate limits or pagination');
  console.log('4. Compare with the direct API test results');
};

// Run the test
main().catch(console.error);
