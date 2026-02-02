import { NextResponse } from 'next/server';
import { db } from '../../../src/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Categorize a plan as global, regional, or other based on its properties
function categorizePlan(planData) {
  const countryCodes = planData.country_codes || planData.country_ids || [];
  const planType = (planData.type || '').toLowerCase();
  const planRegion = (planData.region || planData.region_slug || '').toLowerCase();
  const planName = (planData.name || planData.title || '').toLowerCase();
  const planSlug = (planData.slug || planData.id || '').toLowerCase();
  
  // Check if it's a global package (VERY STRICT - only based on type/region OR known global identifiers)
  const isGlobal = (
    planType === 'global' ||
    planRegion === 'global' ||
    planSlug === 'global' ||
    planName === 'global' ||
    planSlug.startsWith('discover') ||  // Discover/Discover+ are Airalo's global packages
    planName.startsWith('discover')
  );
  
  // Check if it's a regional package (check against known regional slugs/names)
  const regionalIdentifiers = [
    'asia', 'europe', 'africa', 'americas', 'middle-east', 'middle east',
    'oceania', 'caribbean', 'latin-america', 'latin america',
    'north-america', 'south-america', 'central-america',
    'eastern-europe', 'western-europe', 'scandinavia',
    'asean', 'gcc', 'european-union', 'eu', 'mena',
    'middle-east-and-north-africa', 'middle-east-north-africa'
  ];
  
  const isRegional = (
    planType === 'regional' ||
    regionalIdentifiers.includes(planSlug) ||
    regionalIdentifiers.includes(planName) ||
    (planRegion && planRegion !== '' && planRegion !== 'global' && regionalIdentifiers.includes(planRegion))
  );
  
  if (isGlobal) {
    return 'global';
  } else if (isRegional) {
    return 'regional';
  } else {
    return 'other';
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countriesOnly = searchParams.get('countries_only') === 'true';
    
    console.log(`🔄 Starting Airalo sync... ${countriesOnly ? '(Countries Only)' : '(Plans Only)'}`);
    
    // If countries-only sync, use Supabase Edge Function
    if (countriesOnly) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase URL and Anon Key must be configured in environment variables');
        }
        
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-countries`;
        
        console.log('📞 Calling Supabase Edge Function for countries sync...');
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to sync countries via Supabase Edge Function');
        }
        
        console.log(`✅ Countries synced via Supabase Edge Function: ${result.details?.total_processed || 0}`);
        
        // Create sync log in Firestore (optional - for tracking)
        try {
          const logRef = doc(collection(db, 'sync_logs'));
          await setDoc(logRef, {
            timestamp: serverTimestamp(),
            countries_synced: result.details?.total_processed || 0,
            plans_synced: 0,
            status: 'completed',
            source: 'admin_manual_sync',
            sync_type: 'countries_only_sync',
            provider: 'airalo',
            storage: 'supabase'
          });
        } catch (logError) {
          console.warn('⚠️ Failed to create sync log:', logError);
        }
        
        return NextResponse.json({
          success: true,
          message: result.message || `Successfully synced ${result.details?.total_processed || 0} countries from Airalo to Supabase`,
          total_synced: result.details?.total_processed || 0,
          countries: [], // Countries are now in Supabase
          plans: [],
          details: {
            countries_synced: result.details?.total_processed || 0,
            plans_synced: 0,
            new_countries: result.details?.new_countries || 0,
            updated_countries: result.details?.updated_countries || 0,
          }
        });
      } catch (error) {
        console.error('❌ Error syncing countries via Supabase Edge Function:', error);
        return NextResponse.json({
          success: false,
          error: `Error syncing countries: ${error.message}`
        }, { status: 500 });
      }
    }
    
    // Get Airalo credentials from Firestore for plans sync
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloConfig = await getDoc(airaloConfigRef);
    
    if (!airaloConfig.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Airalo configuration not found. Please set up Airalo credentials in the admin panel.'
      }, { status: 400 });
    }
    
    const configData = airaloConfig.data();
    // Get client ID from Firestore first, fallback to environment variables
    const clientId = configData.api_key || 
                     process.env.AIRALO_CLIENT_ID || 
                     process.env.AIRALO_API_KEY;
    
    // Get markup percentage from configuration (default to 17%)
    const markupConfigRef = doc(db, 'config', 'pricing');
    const markupConfig = await getDoc(markupConfigRef);
    const markupPercentage = markupConfig.exists() ? (markupConfig.data().markup_percentage || 17) : 17;
    
    console.log(`💰 Using markup percentage: ${markupPercentage}%`);
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Airalo API key not found. Please set it in the admin panel (config/airalo) or set AIRALO_CLIENT_ID/AIRALO_API_KEY in environment variables.'
      }, { status: 400 });
    }
    
    console.log(`🔧 Using Airalo SDK with client ID: ${clientId.substring(0, 10)}...`);
    
    // Get client secret from environment variables (server-side only)
    // Check multiple possible env var names (like fetch-airalo-packages does)
    const clientSecret = process.env.AIRALO_CLIENT_SECRET_PRODUCTION || 
                         process.env.AIRALO_CLIENT_SECRET || 
                         process.env.AIRALO_SECRET;
      
    console.log(`🔑 Client Secret loaded: ${clientSecret ? 'YES' : 'NO'} (${clientSecret ? clientSecret.substring(0, 10) + '...' : 'undefined'})`);
    
    if (!clientSecret) {
      return NextResponse.json({
        success: false,
        error: 'Airalo client secret not found in environment variables. Please add AIRALO_CLIENT_SECRET_PRODUCTION, AIRALO_CLIENT_SECRET, or AIRALO_SECRET to your Vercel environment variables.'
      }, { status: 400 });
    }
    
    let totalSynced = { countries: 0, packages: 0, topups: 0 }; // Separate counters for plans and topups
    let countriesSyncedCount = 0;
    let topupsSyncedCount = 0; // Declare outside try block so it's accessible later
    
      // Declare allTopups outside try block so it's accessible later
      let allTopups = [];
      
      // Fetch and sync packages using Node.js SDK (like Python SDK does)
      try {
        console.log('📱 Fetching packages from Airalo using Node.js SDK...');
        
        // Use Node.js SDK to get all packages (like Python SDK's get_all_packages)
        const { Airalo } = await import('airalo-sdk');
        const airalo = new Airalo({
          client_id: clientId,
          client_secret: clientSecret,
          env: 'production'
        });
        
        await airalo.initialize();
        console.log('✅ Airalo SDK initialized');
        
        // Get all packages with flat=false to get full nested structure (like Python SDK)
        console.log('📦 Fetching all packages from Airalo SDK (this may take a moment)...');
        const result = await airalo.getAllPackages(false); // false = nested structure like Python SDK
        
        // Extract plans from SDK response
        let plans = [];
        if (result && result.data && Array.isArray(result.data)) {
          plans = result.data;
          console.log(`📊 SDK returned ${plans.length} plans (nested structure)`);
        } else if (Array.isArray(result)) {
          plans = result;
          console.log(`📊 SDK returned ${plans.length} plans (direct array)`);
        } else if (result && result.packages && Array.isArray(result.packages)) {
          plans = result.packages;
          console.log(`📊 SDK returned ${plans.length} plans (packages key)`);
        } else {
          console.error('❌ Unexpected SDK response structure:', {
            type: typeof result,
            keys: result ? Object.keys(result) : 'null'
          });
          throw new Error('SDK returned unexpected format');
        }
        
        const packagesData = plans;
      
      console.log(`📊 Received ${plans.length} plans from API`);
      
      if (plans.length === 0) {
        console.warn('⚠️ WARNING: No plans received from API - countries cannot be extracted');
        return NextResponse.json({
          success: false,
          error: 'No plans received from Airalo API. Cannot extract countries without package data.'
        }, { status: 400 });
      }
      
      // Extract all packages and countries from all plans
      const allPackages = [];
      allTopups = []; // Reset topups array (already declared above)
      const countriesMap = new Map();
      
      // Look for plans that have packages (these are the actual plans with pricing data)
      const plansWithPackages = plans.filter(p => p.packages && Array.isArray(p.packages));
      console.log(`📦 Found ${plansWithPackages.length} plans with packages array`);
      
      // Also look for plans that have operators with packages
      const plansWithOperators = plans.filter(p => p.operators && Array.isArray(p.operators));
      console.log(`🏢 Found ${plansWithOperators.length} plans with operators array`);
      
      // Also check for top-level global/regional plans (like "Discover", "Europe", etc.)
      // These might not have packages array but should be categorized
      const topLevelPlans = plans.filter(p => {
        const hasPackages = p.packages && Array.isArray(p.packages) && p.packages.length > 0;
        const hasOperators = p.operators && Array.isArray(p.operators) && p.operators.length > 0;
        return !hasPackages && !hasOperators && (p.id || p.slug);
      });
      console.log(`🌐 Found ${topLevelPlans.length} top-level plans (potential global/regional)`);
      
      // Process plans with direct packages
      for (const plan of plansWithPackages) {
        // Categorize the parent plan first
        const planCountryCodes = plan.countries ? plan.countries.map(c => c.country_code).filter(Boolean) : [];
        const parentPlanData = {
          country_codes: planCountryCodes,
          type: plan.type || '',
          region: plan.region || plan.region_slug || '',
          name: plan.name || plan.title || '',
          slug: plan.id || plan.slug || ''
        };
        const category = categorizePlan(parentPlanData);
        const isGlobal = category === 'global';
        const isRegional = category === 'regional';
        
        // For global/regional plans, check for sub-packages first (like Python SDK)
        // Python checks: packages, sub_packages, children, OR operators[].packages
        if (isGlobal || isRegional) {
          // Collect all sub-packages from various locations (like Python does)
          let subPackages = [];
          
          if (plan.packages && Array.isArray(plan.packages)) {
            subPackages = [...plan.packages];
          } else if (plan.sub_packages && Array.isArray(plan.sub_packages)) {
            subPackages = [...plan.sub_packages];
          } else if (plan.children && Array.isArray(plan.children)) {
            subPackages = [...plan.children];
          }
          
          // Also check operators for packages (Python does this too)
          if (plan.operators && Array.isArray(plan.operators)) {
            for (const operator of plan.operators) {
              if (operator.packages && Array.isArray(operator.packages)) {
                subPackages.push(...operator.packages);
              }
            }
          }
          
          // Process each sub-package individually
          if (subPackages.length > 0) {
            for (let subIdx = 0; subIdx < subPackages.length; subIdx++) {
              const subPkg = subPackages[subIdx];
              if (!subPkg || typeof subPkg !== 'object') continue;
            
            // Check multiple price fields (like Python does)
            const priceFields = [
              subPkg.price,
              subPkg.retail_price,
              subPkg.amount,
              subPkg.cost,
              subPkg.base_price
            ];
            
            if (subPkg.pricing && typeof subPkg.pricing === 'object') {
              priceFields.push(
                subPkg.pricing.price,
                subPkg.pricing.retail_price,
                subPkg.pricing.amount
              );
            }
            
            let subPrice = 0;
            for (const priceField of priceFields) {
              if (priceField != null) {
                const parsed = parseFloat(priceField);
                if (!isNaN(parsed) && parsed > 0) {
                  subPrice = parsed;
                  break;
                }
              }
            }
            
            if (subPrice === 0) continue;
            
            // Generate sub-package ID
            const subPackageId = subPkg.id || `${plan.id}_${subIdx}`;
            
            // Check if this is a topup sub-package - check for "-topup" at the end of slug
            // Example: "pondu-mobile-in-7days-1gb-topup"
            const subSlug = String(subPackageId || subPkg.slug || subPkg.id || '').toLowerCase();
            const subType = String(subPkg.type || '').toLowerCase();
            const subName = String(subPkg.title || subPkg.name || '').toLowerCase();
            
            // Primary check: "-topup" at the end of slug (most common pattern)
            const hasTopupSuffix = subSlug.endsWith('-topup') || subSlug.endsWith('_topup');
            
            const subIsTopup = (
              subPkg.is_topup === true ||
              subPkg.topup === true ||
              hasTopupSuffix ||
              subSlug.includes('-topup') ||
              subSlug.includes('_topup') ||
              subSlug.includes('topup') ||
              subType.includes('topup') ||
              subType.includes('top-up') ||
              subName.includes('topup') ||
              subName.includes('top-up')
            );
            
            // Mark topups but save them to dataplans collection (not separate collection)
            if (subIsTopup) {
              console.log(`🔋 Detected topup sub-package: ${subPkg.title || subPkg.name} (ID: ${subPackageId}, Type: ${subPkg.type})`);
              // Continue processing - will be saved to dataplans with is_topup flag
            }
            
            allPackages.push({
              ...subPkg,
              id: subPackageId,
              plan_title: plan.title,
              plan_id: plan.id,
              country_codes: planCountryCodes,
              parent_category: category,
              is_global: isGlobal,
              is_regional: isRegional,
              type: category,
              parent_package_id: plan.id
            });
            }
          }
        } else {
          // Regular plan - extract packages normally
          for (const pkg of plan.packages) {
            // Check multiple price fields
            const priceFields = [
              pkg.price,
              pkg.retail_price,
              pkg.amount,
              pkg.cost,
              pkg.base_price
            ];
            
            if (pkg.pricing && typeof pkg.pricing === 'object') {
              priceFields.push(
                pkg.pricing.price,
                pkg.pricing.retail_price,
                pkg.pricing.amount
              );
            }
            
            let pkgPrice = 0;
            for (const priceField of priceFields) {
              if (priceField != null) {
                const parsed = parseFloat(priceField);
                if (!isNaN(parsed) && parsed > 0) {
                  pkgPrice = parsed;
                  break;
                }
              }
            }
            
            if (pkgPrice === 0) {
              console.log(`⏭️ Skipping plan package with no price: ${pkg.title || pkg.name} (Plan: ${plan.title})`);
              continue;
            }
            
            // Check if this is a topup package
            const pkgSlug = String(pkg.id || pkg.slug || '').toLowerCase();
            const pkgTitle = String(pkg.title || pkg.name || '').toLowerCase();
            const pkgType = String(pkg.type || '').toLowerCase();
            const hasTopupSuffix = pkgSlug.endsWith('-topup') || pkgSlug.endsWith('_topup');
            
            const isTopup = (
              pkg.is_topup === true ||
              pkg.topup === true ||
              hasTopupSuffix ||
              pkgSlug.includes('-topup') ||
              pkgSlug.includes('_topup') ||
              pkgSlug.includes('topup') ||
              pkgType.includes('topup') ||
              pkgType.includes('top-up') ||
              pkgTitle.includes('topup') ||
              pkgTitle.includes('top-up')
            );
            
            if (isTopup) {
              console.log(`🔋 Detected topup in plan packages: ${pkg.title || pkg.name} (ID: ${pkg.id}, Type: ${pkg.type}, Regional: ${isRegional})`);
              allTopups.push({
                ...pkg,
                is_topup: true,
                is_regional: isRegional,
                is_global: isGlobal,
                parent_category: category
              });
              // Will be saved to topups collection in main processing loop
            }
            
            allPackages.push({
              ...pkg,
              plan_title: plan.title,
              plan_id: plan.id,
              country_codes: planCountryCodes,
              parent_category: category,
              is_global: isGlobal,
              is_regional: isRegional,
              type: category !== 'other' ? category : (pkg.type || 'sim'),
              is_topup: isTopup
            });
          }
        }
        
        // Extract countries from this plan
        if (plan.countries && Array.isArray(plan.countries)) {
          console.log(`🌍 Plan "${plan.title}" has ${plan.countries.length} countries`);
          for (const country of plan.countries) {
            if (country.country_code && country.title) {
              countriesMap.set(country.country_code, {
                code: country.country_code,
                name: country.title,
                flag: country.image?.url || '',
                region_slug: '', // Not provided in this structure
                is_roaming: plan.is_roaming || false
              });
            } else {
              console.warn(`⚠️ Skipping invalid country in plan "${plan.title}":`, country);
            }
          }
        }
      }
      
      // Process plans with operators (the actual structure we're getting)
      // BUT skip if already processed as plansWithPackages (to avoid duplicates)
      for (const plan of plansWithOperators) {
        // Skip if this plan was already processed in plansWithPackages
        if (plansWithPackages.some(p => p.id === plan.id)) {
          continue;
        }
        
        // Categorize the parent plan first
        const planCountryCodes = [plan.country_code].filter(Boolean);
        const parentPlanData = {
          country_codes: planCountryCodes,
          type: plan.type || '',
          region: plan.region || plan.region_slug || '',
          name: plan.name || plan.title || '',
          slug: plan.id || plan.slug || ''
        };
        const category = categorizePlan(parentPlanData);
        const isGlobal = category === 'global';
        const isRegional = category === 'regional';
        
        // For global/regional plans with operators, process each operator's packages as sub-packages
        if ((isGlobal || isRegional) && plan.operators && Array.isArray(plan.operators)) {
          // Collect all packages from all operators
          const allOperatorPackages = [];
          for (const operator of plan.operators) {
            if (operator.packages && Array.isArray(operator.packages)) {
              allOperatorPackages.push(...operator.packages);
            }
          }
          
          // Process each package as a sub-package
          for (let subIdx = 0; subIdx < allOperatorPackages.length; subIdx++) {
            const subPkg = allOperatorPackages[subIdx];
            if (!subPkg || typeof subPkg !== 'object') continue;
            
            // Check multiple price fields
            const priceFields = [
              subPkg.price,
              subPkg.retail_price,
              subPkg.amount,
              subPkg.cost,
              subPkg.base_price
            ];
            
            if (subPkg.pricing && typeof subPkg.pricing === 'object') {
              priceFields.push(
                subPkg.pricing.price,
                subPkg.pricing.retail_price,
                subPkg.pricing.amount
              );
            }
            
            let subPrice = 0;
            for (const priceField of priceFields) {
              if (priceField != null) {
                const parsed = parseFloat(priceField);
                if (!isNaN(parsed) && parsed > 0) {
                  subPrice = parsed;
                  break;
                }
              }
            }
            
            if (subPrice === 0) continue;
            
            // Generate sub-package ID
            const subPackageId = subPkg.id || `${plan.id}_${subIdx}`;
            
            // Check if this is a topup sub-package - check for "-topup" at the end of slug
            // Example: "pondu-mobile-in-7days-1gb-topup"
            const subSlug = String(subPackageId || subPkg.slug || subPkg.id || '').toLowerCase();
            const subType = String(subPkg.type || '').toLowerCase();
            const subName = String(subPkg.title || subPkg.name || '').toLowerCase();
            
            // Primary check: "-topup" at the end of slug (most common pattern)
            const hasTopupSuffix = subSlug.endsWith('-topup') || subSlug.endsWith('_topup');
            
            const subIsTopup = (
              subPkg.is_topup === true ||
              subPkg.topup === true ||
              hasTopupSuffix ||
              subSlug.includes('-topup') ||
              subSlug.includes('_topup') ||
              subSlug.includes('topup') ||
              subType.includes('topup') ||
              subType.includes('top-up') ||
              subName.includes('topup') ||
              subName.includes('top-up')
            );
            
            // Mark topups - they will be saved to topups collection in the main processing loop
            if (subIsTopup) {
              console.log(`🔋 Detected topup sub-package: ${subPkg.title || subPkg.name} (ID: ${subPackageId}, Type: ${subPkg.type}, Regional: ${isRegional})`);
              allTopups.push({
                ...subPkg,
                id: subPackageId,
                is_topup: true,
                is_regional: isRegional,
                is_global: isGlobal,
                parent_category: category
              });
              // Continue processing - will be saved to topups collection in main loop
            }
            
            allPackages.push({
              ...subPkg,
              id: subPackageId,
              plan_title: plan.title,
              plan_id: plan.id,
              country_codes: planCountryCodes,
              parent_category: category,
              is_global: isGlobal,
              is_regional: isRegional,
              type: category,
              parent_package_id: plan.id
            });
          }
        } else {
          // Regular plan - extract packages normally from operators
          for (const operator of plan.operators) {
            // Extract packages from this operator
            if (operator.packages && Array.isArray(operator.packages)) {
              for (const pkg of operator.packages) {
                // Check multiple price fields
                const priceFields = [
                  pkg.price,
                  pkg.retail_price,
                  pkg.amount,
                  pkg.cost,
                  pkg.base_price
                ];
                
                if (pkg.pricing && typeof pkg.pricing === 'object') {
                  priceFields.push(
                    pkg.pricing.price,
                    pkg.pricing.retail_price,
                    pkg.pricing.amount
                  );
                }
                
                let pkgPrice = 0;
                for (const priceField of priceFields) {
                  if (priceField != null) {
                    const parsed = parseFloat(priceField);
                    if (!isNaN(parsed) && parsed > 0) {
                      pkgPrice = parsed;
                      break;
                    }
                  }
                }
                
                if (pkgPrice === 0) continue;
                
                // Check if this is a topup package
                const pkgSlug = String(pkg.id || pkg.slug || '').toLowerCase();
                const pkgTitle = String(pkg.title || pkg.name || '').toLowerCase();
                const pkgType = String(pkg.type || '').toLowerCase();
                const hasTopupSuffix = pkgSlug.endsWith('-topup') || pkgSlug.endsWith('_topup');
                
                const isTopup = (
                  pkg.is_topup === true ||
                  pkg.topup === true ||
                  hasTopupSuffix ||
                  pkgSlug.includes('-topup') ||
                  pkgSlug.includes('_topup') ||
                  pkgSlug.includes('topup') ||
                  pkgType.includes('topup') ||
                  pkgType.includes('top-up') ||
                  pkgTitle.includes('topup') ||
                  pkgTitle.includes('top-up')
                );
                
                if (isTopup) {
                  console.log(`🔋 Detected topup in operator package: ${pkg.title || pkg.name} (ID: ${pkg.id}, Type: ${pkg.type}, Regional: ${isRegional})`);
                  allTopups.push({
                    ...pkg,
                    is_topup: true,
                    is_regional: isRegional,
                    is_global: isGlobal,
                    parent_category: category
                  });
                  // Will be saved to topups collection in main processing loop
                }
                
                allPackages.push({
                  ...pkg,
                  plan_title: operator.title,
                  plan_id: operator.id,
                  country_codes: planCountryCodes,
                  parent_category: category,
                  is_global: isGlobal,
                  is_regional: isRegional,
                  type: category !== 'other' ? category : (pkg.type || 'sim'),
                  is_topup: isTopup
                });
              }
            }
          }
        }
        
        // Extract countries from operators
        for (const operator of plan.operators) {
          if (operator.countries && Array.isArray(operator.countries)) {
            console.log(`🌍 Operator "${operator.title}" has ${operator.countries.length} countries`);
            for (const country of operator.countries) {
              if (country.country_code && country.title) {
                countriesMap.set(country.country_code, {
                  code: country.country_code,
                  name: country.title,
                  flag: country.image?.url || '',
                  region_slug: '', // Not provided in this structure
                  is_roaming: operator.is_roaming || false
                });
              } else {
                console.warn(`⚠️ Skipping invalid country in operator "${operator.title}":`, country);
              }
            }
          }
        }
      }
      
      // Process top-level global/regional plans (like "Discover", "Europe", etc.)
      // These might have sub-packages that need to be extracted
      for (const plan of topLevelPlans) {
        // Categorize the plan
        const planCountryCodes = plan.countries ? plan.countries.map(c => c.country_code || c.code || c).filter(Boolean) : [];
        const parentPlanData = {
          country_codes: planCountryCodes,
          type: plan.type || '',
          region: plan.region || plan.region_slug || '',
          name: plan.name || plan.title || '',
          slug: plan.id || plan.slug || ''
        };
        const category = categorizePlan(parentPlanData);
        const isGlobal = category === 'global';
        const isRegional = category === 'regional';
        
        // Only process if it's actually global/regional
        if (isGlobal || isRegional) {
          console.log(`🌐 Found ${category} plan: ${plan.title} (ID: ${plan.id})`);
          
          // Check for sub-packages in various locations
          const subPackages = plan.packages || plan.sub_packages || plan.children || [];
          
          // Also check operators for packages
          if (plan.operators && Array.isArray(plan.operators)) {
            for (const operator of plan.operators) {
              if (operator.packages && Array.isArray(operator.packages)) {
                subPackages.push(...operator.packages);
              }
            }
          }
          
          // Process each sub-package
          for (let subIdx = 0; subIdx < subPackages.length; subIdx++) {
            const subPkg = subPackages[subIdx];
            if (!subPkg || typeof subPkg !== 'object') continue;
            
            // Check multiple price fields (like Python does)
            const priceFields = [
              subPkg.price,
              subPkg.retail_price,
              subPkg.amount,
              subPkg.cost,
              subPkg.base_price
            ];
            
            if (subPkg.pricing && typeof subPkg.pricing === 'object') {
              priceFields.push(
                subPkg.pricing.price,
                subPkg.pricing.retail_price,
                subPkg.pricing.amount
              );
            }
            
            let subPrice = 0;
            for (const priceField of priceFields) {
              if (priceField != null) {
                const parsed = parseFloat(priceField);
                if (!isNaN(parsed) && parsed > 0) {
                  subPrice = parsed;
                  break;
                }
              }
            }
            
            if (subPrice === 0) continue;
            
            // Generate sub-package ID
            const subPackageId = subPkg.id || `${plan.id}_${subIdx}`;
            
            // Check if this is a topup sub-package - check for "-topup" at the end of slug
            // Example: "pondu-mobile-in-7days-1gb-topup"
            const subSlug = String(subPackageId || subPkg.slug || subPkg.id || '').toLowerCase();
            const subType = String(subPkg.type || '').toLowerCase();
            const subName = String(subPkg.title || subPkg.name || '').toLowerCase();
            
            // Primary check: "-topup" at the end of slug (most common pattern)
            const hasTopupSuffix = subSlug.endsWith('-topup') || subSlug.endsWith('_topup');
            
            const subIsTopup = (
              subPkg.is_topup === true ||
              subPkg.topup === true ||
              hasTopupSuffix ||
              subSlug.includes('-topup') ||
              subSlug.includes('_topup') ||
              subSlug.includes('topup') ||
              subType.includes('topup') ||
              subType.includes('top-up') ||
              subName.includes('topup') ||
              subName.includes('top-up')
            );
            
            // Mark topups - they will be saved to topups collection in the main processing loop
            if (subIsTopup) {
              console.log(`🔋 Detected topup sub-package: ${subPkg.title || subPkg.name} (ID: ${subPackageId}, Type: ${subPkg.type}, Regional: ${isRegional})`);
              allTopups.push({
                ...subPkg,
                id: subPackageId,
                is_topup: true,
                is_regional: isRegional,
                is_global: isGlobal,
                parent_category: category
              });
              // Continue processing - will be saved to topups collection in main loop
            }
            
            allPackages.push({
              ...subPkg,
              id: subPackageId,
              plan_title: plan.title,
              plan_id: plan.id,
              country_codes: planCountryCodes,
              parent_category: category,
              is_global: isGlobal,
              is_regional: isRegional,
              type: category,
              parent_package_id: plan.id
            });
          }
        }
      }
      
      // Also process individual country entries (these are just country listings)
      for (const plan of plans) {
        // Handle individual country entries (like "United States", "France", etc.)
        if (plan.country_code && plan.title && !plan.packages && !plan.countries && !plan.operators) {
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
      
      // IMPORTANT: Also scan ALL plans directly for topups (like Python SDK does)
      // The Python SDK checks EVERY package in the response, not just extracted ones
      console.log(`🔍 Scanning ALL ${plans.length} plans from API for topups...`);
      let topupsFromAllPlans = 0;
      
      // Debug: Log first plan structure to understand response format
      if (plans.length > 0) {
        const firstPlan = plans[0];
        console.log(`🔍 Sample plan structure:`, {
          hasId: !!firstPlan.id,
          hasSlug: !!firstPlan.slug,
          idType: typeof firstPlan.id,
          slugType: typeof firstPlan.slug,
          keys: Object.keys(firstPlan).slice(0, 15),
          hasPackages: !!firstPlan.packages,
          hasOperators: !!firstPlan.operators
        });
      }
      
      for (const plan of plans) {
        // Check if the plan itself is a topup - convert to string safely
        const planId = plan.id;
        const planSlug = plan.slug;
        if (planId !== undefined && planId !== null || planSlug !== undefined && planSlug !== null) {
          const planSlugStr = String(planId || planSlug || '').toLowerCase();
          const planName = String(plan.name || plan.title || '').toLowerCase();
          const planType = String(plan.type || '').toLowerCase();
          
          const isTopupPlan = (
            plan.is_topup === true ||
            plan.topup === true ||
            planSlug.includes('-topup') ||
            planSlug.endsWith('-topup') ||
            planType.includes('topup') ||
            planType.includes('top-up') ||
            planName.includes('topup') ||
            planName.includes('top-up')
          );
          
          if (isTopupPlan && !allTopups.find(t => t.id === plan.id || t.id === plan.slug)) {
            console.log(`🔋 Found topup plan in root: ${plan.title || plan.name} (ID: ${plan.id || plan.slug})`);
            allTopups.push({
              ...plan,
              id: plan.id || plan.slug,
              country_codes: plan.countries ? plan.countries.map(c => c.country_code || c.code).filter(Boolean) : []
            });
            topupsFromAllPlans++;
          }
        }
        
        // Check ALL nested structures for topups (like Python SDK does)
        const checkNestedForTopups = (obj, path = '', depth = 0) => {
          // Prevent infinite recursion
          if (depth > 10 || !obj || typeof obj !== 'object' || obj === null) return;
          
          // Skip if already processed (avoid duplicates)
          if (Array.isArray(obj)) {
            obj.forEach((item, idx) => {
              if (item && typeof item === 'object' && item !== null) {
                checkNestedForTopups(item, `${path}[${idx}]`, depth + 1);
              }
            });
            return;
          }
          
          // Check if this object itself is a topup
          const objId = obj.id;
          const objSlug = obj.slug;
          const hasId = objId !== undefined && objId !== null;
          const hasSlug = objSlug !== undefined && objSlug !== null;
          
          if (hasId || hasSlug) {
            // Convert to string safely
            const objSlugStr = String(hasId ? objId : (hasSlug ? objSlug : '')).toLowerCase();
            const objName = String(obj.name || obj.title || '').toLowerCase();
            const objType = String(obj.type || '').toLowerCase();
            
            // Primary check: "-topup" at the end of slug (e.g., "pondu-mobile-in-7days-1gb-topup")
            const hasTopupSuffix = objSlugStr.endsWith('-topup') || objSlugStr.endsWith('_topup');
            
            const isTopup = (
              obj.is_topup === true ||
              obj.topup === true ||
              hasTopupSuffix ||
              objSlugStr.includes('-topup') ||
              objSlugStr.includes('_topup') ||
              objSlugStr.includes('topup') ||
              objType.includes('topup') ||
              objType.includes('top-up') ||
              objName.includes('topup') ||
              objName.includes('top-up')
            );
            
            if (isTopup) {
              const topupId = String(hasId ? objId : objSlug);
              if (!allTopups.find(t => String(t.id) === topupId)) {
                console.log(`🔋 Found topup in nested structure ${path}: ${obj.title || obj.name} (ID: ${topupId})`);
                
                // Extract country codes
                let countryCodes = [];
                if (obj.countries && Array.isArray(obj.countries)) {
                  countryCodes = obj.countries.map(c => c.country_code || c.code || c).filter(Boolean);
                } else if (obj.country_codes && Array.isArray(obj.country_codes)) {
                  countryCodes = obj.country_codes;
                } else if (obj.country_code) {
                  countryCodes = [obj.country_code];
                }
                
                // Add to allTopups for tracking
                allTopups.push({
                  ...obj,
                  id: topupId,
                  country_codes: countryCodes,
                  is_topup: true
                });
                
                // IMPORTANT: Also add to allPackages so it gets saved to Firestore
                allPackages.push({
                  ...obj,
                  id: topupId,
                  title: obj.title || obj.name,
                  name: obj.name || obj.title,
                  country_codes: countryCodes,
                  is_topup: true
                });
                
                topupsFromAllPlans++;
              }
            }
          }
          
          // Recursively check nested objects (but not arrays - those are handled above)
          if (!Array.isArray(obj)) {
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                // Skip certain keys to avoid infinite loops
                if (key === 'parent' || key === 'root' || key === '__parent__') continue;
                if (value && typeof value === 'object' && value !== null) {
                  checkNestedForTopups(value, `${path}.${key}`, depth + 1);
                }
              }
            }
          }
        };
        
        // Check all nested structures in this plan
        if (plan.packages) checkNestedForTopups(plan.packages, 'packages');
        if (plan.operators) checkNestedForTopups(plan.operators, 'operators');
        if (plan.sub_packages) checkNestedForTopups(plan.sub_packages, 'sub_packages');
        if (plan.children) checkNestedForTopups(plan.children, 'children');
      }
      
      console.log(`🔋 Found ${topupsFromAllPlans} additional topups by scanning all plans`);
      console.log(`📦 Extracted ${allPackages.length} packages`);
      console.log(`🔋 Total topup packages found: ${allTopups.length}`);
      console.log(`🌍 Extracted ${countriesMap.size} countries from packages data`);
      
      // Sync countries directly to Supabase (using the countries we extracted from plans)
      if (countriesMap.size > 0 && supabaseAdmin) {
        try {
          console.log(`🔄 Syncing ${countriesMap.size} countries directly to Supabase...`);
          let newCount = 0;
          let updatedCount = 0;
          
          // Convert countriesMap to array for batch processing
          const countriesArray = Array.from(countriesMap.entries()).map(([code, country]) => ({
            airalo_country_code: code,
            country_name: country.name,
            flag_url: country.flag || null,
            is_visible: true,
            last_synced_at: new Date().toISOString(),
          }));
          
          // Process countries in batches to avoid overwhelming Supabase
          const batchSize = 50;
          for (let i = 0; i < countriesArray.length; i += batchSize) {
            const batch = countriesArray.slice(i, i + batchSize);
            
            // Use upsert to insert or update countries
            const { data, error } = await supabaseAdmin
              .from('esim_countries')
              .upsert(batch, {
                onConflict: 'airalo_country_code',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`❌ Error upserting countries batch ${i / batchSize + 1}:`, error);
              // Continue with next batch even if one fails
              continue;
            }
            
            // Count new vs updated (upsert doesn't tell us, so we'll estimate)
            // For now, we'll count all as processed
            const processedInBatch = batch.length;
            newCount += processedInBatch; // Approximate - upsert doesn't distinguish
          }
          
          countriesSyncedCount = countriesMap.size;
          console.log(`✅ Successfully synced ${countriesSyncedCount} countries to Supabase`);
        } catch (error) {
          console.error('❌ Error syncing countries to Supabase:', error);
          // Don't fail the entire sync if countries sync fails
          // But still try to use the count we extracted
          countriesSyncedCount = countriesMap.size;
        }
      } else if (countriesMap.size > 0 && !supabaseAdmin) {
        console.warn('⚠️ Supabase admin client not configured - skipping countries sync');
        countriesSyncedCount = countriesMap.size; // Still count them for reporting
      }
      
      // Process plans (save as plans, not packages)
      const plansBatch = [];
      const topupsBatch = [];
      const unlimitedBatch = [];
      const smsBatch = [];
      const syncedPlans = []; // Collect plans for response
      const supabasePackagesArray = []; // Collect all packages for Supabase
      
      // If we have packages, process them as individual plans
      if (allPackages.length > 0) {
        console.log(`📦 Processing ${allPackages.length} extracted packages...`);
        let skippedCountryEntries = 0;
        let skippedNoPrice = 0;
        let validPlans = 0;
        
        // Debug: Log packages with "top" in slug/name to see if we're missing any
        const packagesWithTop = allPackages.filter(pkg => {
          const slug = (pkg.id || pkg.slug || '').toLowerCase();
          const name = (pkg.title || pkg.name || '').toLowerCase();
          return slug.includes('top') || name.includes('top');
        });
        
        if (packagesWithTop.length > 0) {
          console.log(`🔍 Found ${packagesWithTop.length} packages with "top" in slug/name (checking for topups):`);
          packagesWithTop.slice(0, 10).forEach(pkg => {
            const slug = (pkg.id || pkg.slug || '').toLowerCase();
            const name = (pkg.title || pkg.name || '').toLowerCase();
            const isTopup = slug.includes('top-up') || slug.includes('topup') || name.includes('top-up') || name.includes('topup');
            console.log(`  - ${pkg.title} (ID: ${pkg.id}, Slug: ${slug}, IsTopup: ${isTopup})`);
          });
        }
        
        for (const pkg of allPackages) {
          if (!pkg.id || !pkg.title) {
            console.log(`⚠️ Skipping package without id or title:`, { id: pkg.id, title: pkg.title });
            continue;
          }
          
          // Use country codes from the package (already extracted)
          const countryCodes = pkg.country_codes || [];
          
          // Calculate retail price with markup - check multiple price fields
          const priceFields = [
            pkg.price,
            pkg.retail_price,
            pkg.amount,
            pkg.cost,
            pkg.base_price
          ];
          
          if (pkg.pricing && typeof pkg.pricing === 'object') {
            priceFields.push(
              pkg.pricing.price,
              pkg.pricing.retail_price,
              pkg.pricing.amount
            );
          }
          
          let originalPrice = 0;
          for (const priceField of priceFields) {
            if (priceField != null) {
              const parsed = parseFloat(priceField);
              if (!isNaN(parsed) && parsed > 0) {
                originalPrice = parsed;
                break;
              }
            }
          }
          
          const retailPrice = Math.round(originalPrice * (1 + markupPercentage / 100));
          
          // Skip packages with no valid price - these are likely country entries or invalid packages
          if (originalPrice === 0 || retailPrice === 0) {
            console.log(`⏭️ Skipping package with no price: ${pkg.title} (ID: ${pkg.id})`);
            skippedNoPrice++;
            continue;
          }
          
          // Additional validation: check if this looks like a country entry
          // Country entries typically have no capacity, period, or operator
          const hasCapacity = pkg.amount && pkg.amount > 0;
          const hasPeriod = pkg.day && pkg.day > 0;
          const hasOperator = pkg.operator && pkg.operator.trim().length > 0;
          
          if (!hasCapacity && !hasPeriod && !hasOperator && countryCodes.length === 0) {
            console.log(`⏭️ Skipping country-like entry (no capacity/period/operator): ${pkg.title} (ID: ${pkg.id})`);
            skippedCountryEntries++;
            continue;
          }
          
          // Determine categorization - use from parent plan if available, otherwise categorize this package
          // Do this BEFORE checking for topup so we can use the values
          let finalCategory = pkg.parent_category;
          let finalIsGlobal = pkg.is_global;
          let finalIsRegional = pkg.is_regional;
          let finalType = pkg.type;
          
          if (!finalCategory) {
            const packagePlanData = {
              country_codes: countryCodes,
              type: pkg.type || '',
              region: pkg.region || pkg.region_slug || '',
              name: pkg.title || pkg.name || '',
              slug: pkg.id || pkg.slug || ''
            };
            finalCategory = categorizePlan(packagePlanData);
            finalIsGlobal = finalCategory === 'global';
            finalIsRegional = finalCategory === 'regional';
            finalType = finalCategory !== 'other' ? finalCategory : (pkg.type || 'sim');
          }
          
          // Detect if this is a topup package - check for "-topup" at the end of slug (e.g., "pondu-mobile-in-7days-1gb-topup")
          // Python checks: is_topup, topup, '-topup' in slug, slug.endswith('-topup'), 'topup'/'top-up' in type/name
          const pkgSlug = String(pkg.id || pkg.slug || '').toLowerCase();
          const pkgTitle = String(pkg.title || pkg.name || '').toLowerCase();
          const pkgType = String(pkg.type || '').toLowerCase();
          
          // Primary check: "-topup" at the end of slug (most common pattern)
          const hasTopupSuffix = pkgSlug.endsWith('-topup') || pkgSlug.endsWith('_topup');
          
          const isTopup = (
            pkg.is_topup === true ||
            pkg.topup === true ||
            hasTopupSuffix ||
            pkgSlug.includes('-topup') ||
            pkgSlug.includes('_topup') ||
            pkgSlug.includes('topup') ||
            pkgType.includes('topup') ||
            pkgType.includes('top-up') ||
            pkgTitle.includes('topup') ||
            pkgTitle.includes('top-up')
          );
          
          // Debug: Log first 5 packages with "top" in slug to see what we're checking
          if (validPlans < 5 && (pkgSlug.includes('top') || pkgTitle.includes('top'))) {
            console.log(`🔍 Checking package for topup:`, {
              id: pkg.id,
              slug: pkgSlug,
              title: pkgTitle,
              type: pkgType,
              is_topup: pkg.is_topup,
              topup: pkg.topup,
              detected: isTopup
            });
          }
          
          // Detect if this is an unlimited package
          const capacity = pkg.amount || 0;
          const isUnlimited = (
            capacity === -1 ||
            capacity === 0 ||
            capacity === 'Unlimited' ||
            (typeof capacity === 'string' && capacity.toLowerCase().includes('unlimited')) ||
            pkgTitle.includes('unlimited') ||
            pkgSlug.includes('unlimited')
          );
          
          // Detect if this is an SMS package (has text/voice/sms capabilities)
          const hasText = pkg.text === true || pkg.text === 'true' || pkg.text === 'yes';
          const hasVoice = pkg.voice === true || pkg.voice === 'true' || pkg.voice === 'yes';
          const hasSMS = pkg.sms === true || pkg.sms === 'true' || pkg.sms === 'yes';
          const hasSMSInName = pkgTitle.includes('sms') || pkgTitle.includes('text');
          const hasSMSInDesc = (pkg.short_info || '').toLowerCase().includes('sms') || (pkg.short_info || '').toLowerCase().includes('text');
          
          const isSMS = hasText || hasVoice || hasSMS || hasSMSInName || hasSMSInDesc;
          
          console.log(`✅ Processing valid plan: ${pkg.title} (ID: ${pkg.id}, Price: $${retailPrice}, Countries: ${countryCodes.length}, Topup: ${isTopup}, Unlimited: ${isUnlimited}, SMS: ${isSMS})`);
          
          // Prepare common data fields
          const commonData = {
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
            // Global/Regional categorization
            type: finalType,
            is_global: finalIsGlobal,
            is_regional: finalIsRegional,
            region: pkg.region || pkg.region_slug || '',
            // Additional fields from Airalo API
            is_roaming: pkg.is_roaming || false,
            data: pkg.data || '',
            voice: pkg.voice || null,
            text: pkg.text || null,
            net_price: pkg.net_price || 0,
            prices: pkg.prices || {}
          };
          
          // Save topups to appropriate collection based on type
          if (isTopup) {
            console.log(`🔋 Detected topup package: ${pkg.title} (ID: ${pkg.id}, Type: ${pkg.type}, Regional: ${finalIsRegional}, Unlimited: ${isUnlimited}, SMS: ${isSMS})`);
            allTopups.push({
              ...pkg,
              is_topup: true,
              is_regional: finalIsRegional,
              is_global: finalIsGlobal,
              parent_category: finalCategory
            });
            
            // Add to Supabase packages array
            supabasePackagesArray.push({
              ...pkg,
              is_topup: true,
              is_regional: finalIsRegional,
              is_global: finalIsGlobal,
              parent_category: finalCategory,
              country_codes: countryCodes,
              price: retailPrice,
              original_price: originalPrice
            });
            
            const topupData = {
              ...commonData,
              is_topup: true
            };
            
            // If unlimited, save ONLY to topups-unlimited collection
            if (isUnlimited) {
              const unlimitedRef = doc(db, 'topups-unlimited', pkg.id);
              unlimitedBatch.push(setDoc(unlimitedRef, { ...topupData, is_unlimited: true }, { merge: true }));
              console.log(`♾️ Saving unlimited topup ONLY to topups-unlimited collection: ${pkg.title}`);
              
              // Update Supabase package array entry
              const existingIndex = supabasePackagesArray.findIndex(sp => sp.id === pkg.id);
              if (existingIndex >= 0) {
                supabasePackagesArray[existingIndex].is_unlimited = true;
              }
              
              validPlans++;
              totalSynced.topups++;
              continue; // Skip saving to main topups collection
            }
            
            // If SMS, save ONLY to topups-sms collection
            if (isSMS) {
              const smsRef = doc(db, 'topups-sms', pkg.id);
              smsBatch.push(setDoc(smsRef, { ...topupData, is_sms: true }, { merge: true }));
              console.log(`💬 Saving SMS topup ONLY to topups-sms collection: ${pkg.title}`);
              
              // Update Supabase package array entry
              const existingIndex = supabasePackagesArray.findIndex(sp => sp.id === pkg.id);
              if (existingIndex >= 0) {
                supabasePackagesArray[existingIndex].is_sms = true;
              }
              
              validPlans++;
              totalSynced.topups++;
              continue; // Skip saving to main topups collection
            }
            
            // Regular topup - save to topups collection
            const topupRef = doc(db, 'topups', pkg.id);
            topupsBatch.push(setDoc(topupRef, topupData, { merge: true }));
            
            // Skip saving to dataplans - topups go to topups collection
            validPlans++;
            totalSynced.topups++; // Count topups separately, not in packages
            continue;
          }
          
          // Check for unlimited/SMS BEFORE creating plan reference
          // Re-check unlimited detection to be absolutely sure (double-check slug/name/ID)
          const checkId = String(pkg.id || '').toLowerCase();
          const checkSlug = String(pkg.slug || pkg.id || '').toLowerCase();
          const checkName = String(pkg.title || pkg.name || '').toLowerCase();
          const finalIsUnlimited = isUnlimited || 
                                   checkId.includes('unlimited') || 
                                   checkSlug.includes('unlimited') || 
                                   checkName.includes('unlimited');
          
          // If unlimited, save ONLY to dataplans-unlimited collection
          if (finalIsUnlimited) {
            const planData = {
              ...commonData
            };
            const unlimitedRef = doc(db, 'dataplans-unlimited', pkg.id);
            unlimitedBatch.push(setDoc(unlimitedRef, { ...planData, is_unlimited: true }, { merge: true }));
            console.log(`♾️ Saving unlimited plan ONLY to dataplans-unlimited collection: ${pkg.title} (ID: ${pkg.id}, detected: ${finalIsUnlimited})`);
            
            // Add to Supabase packages array
            supabasePackagesArray.push({
              ...pkg,
              is_topup: false,
              is_regional: finalIsRegional,
              is_global: finalIsGlobal,
              parent_category: finalCategory,
              country_codes: countryCodes,
              price: retailPrice,
              original_price: originalPrice,
              is_unlimited: true,
              is_sms: isSMS
            });
            
            validPlans++;
            totalSynced.packages++;
            continue; // Skip saving to main dataplans collection
          }
          
          // If SMS, save ONLY to dataplans-sms collection
          if (isSMS) {
            const planData = {
              ...commonData
            };
            const smsRef = doc(db, 'dataplans-sms', pkg.id);
            smsBatch.push(setDoc(smsRef, { ...planData, is_sms: true }, { merge: true }));
            console.log(`💬 Saving SMS plan ONLY to dataplans-sms collection: ${pkg.title}`);
            
            // Add to Supabase packages array
            supabasePackagesArray.push({
              ...pkg,
              is_topup: false,
              is_regional: finalIsRegional,
              is_global: finalIsGlobal,
              parent_category: finalCategory,
              country_codes: countryCodes,
              price: retailPrice,
              original_price: originalPrice,
              is_unlimited: false,
              is_sms: true
            });
            
            validPlans++;
            totalSynced.packages++;
            continue; // Skip saving to main dataplans collection
          }
          
          // Regular plan - save to dataplans collection
          validPlans++;
          const planRef = doc(db, 'dataplans', pkg.id);
          const planData = {
            ...commonData
          };
          plansBatch.push(setDoc(planRef, planData, { merge: true }));
          
          // Add to Supabase packages array
          supabasePackagesArray.push({
            ...pkg,
            is_topup: false,
            is_regional: finalIsRegional,
            is_global: finalIsGlobal,
            parent_category: finalCategory,
            country_codes: countryCodes,
            price: retailPrice,
            original_price: originalPrice,
            is_unlimited: false,
            is_sms: isSMS
          });
          
          // Collect plan for response (format expected by frontend)
          syncedPlans.push({
            slug: pkg.id,
            name: pkg.title,
            description: pkg.short_info || '',
            price: retailPrice,
            retailPrice: retailPrice, // Also include for compatibility
            currency: 'USD',
            originalPrice: originalPrice,
            capacity: pkg.amount || 0,
            period: pkg.day || 0,
            operator: pkg.operator || '',
            countries: countryCodes.map(code => ({
              countryCode: code,
              code: code
            })),
            country_codes: countryCodes,
            is_roaming: pkg.is_roaming || false,
            is_topup: isTopup, // Include topup flag in response
            is_global: finalIsGlobal,
            is_regional: finalIsRegional,
            type: finalType
          });
          
          totalSynced.packages++;
        }
        
        // Count global/regional packages
        const globalCount = syncedPlans.filter(p => p.is_global === true).length;
        const regionalCount = syncedPlans.filter(p => p.is_regional === true).length;
        const otherCount = syncedPlans.filter(p => !p.is_global && !p.is_regional).length;
        
        console.log(`📊 Package processing summary:`);
        console.log(`   - Valid plans to save: ${validPlans}`);
        console.log(`   - Global packages: ${globalCount}`);
        console.log(`   - Regional packages: ${regionalCount}`);
        console.log(`   - Country packages: ${otherCount}`);
        console.log(`   - Skipped (no price): ${skippedNoPrice}`);
        console.log(`   - Skipped (country entries): ${skippedCountryEntries}`);
      } else {
        // Fallback: process original plans structure (skip country-only entries)
        for (const plan of plans) {
          // Skip country-only entries (these should only be in countries collection)
          if (plan.country_code && plan.title && !plan.packages && !plan.countries && !plan.operators) {
            console.log(`⏭️ Skipping country-only entry: ${plan.title} (${plan.country_code}) - should not be saved as plan`);
            continue;
          }
          
          if (plan.id && plan.title) {
            const planRef = doc(db, 'dataplans', plan.id);
            
            // Extract country codes from plan countries
            const countryCodes = plan.countries ? plan.countries.map(c => c.country_code).filter(Boolean) : [];
            
            // Skip if this is just a country entry with no actual plan data
            if (!plan.packages && !plan.operators && countryCodes.length === 0) {
              console.log(`⏭️ Skipping plan "${plan.title}" - no packages, operators, or country codes`);
              continue;
            }
            
            // Calculate minimum price from packages
            let minPrice = 0;
            if (plan.packages && plan.packages.length > 0) {
              const prices = plan.packages.map(pkg => parseFloat(pkg.price) || 0).filter(price => price > 0);
              minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            }
            
            // Skip plans with no valid price - these are country entries
            if (minPrice === 0) {
              console.log(`⏭️ Skipping plan "${plan.title}" (ID: ${plan.id}) - no valid price found`);
              continue;
            }
            
            // Detect if this is a topup package
            const isTopup = plan.type === 'topup' ||
                           plan.id?.toLowerCase().includes('-topup') ||
                           plan.title?.toLowerCase().includes('topup') ||
                           plan.is_topup === true;
            
            // Detect if this is an unlimited package
            const planCapacity = plan.packages && plan.packages.length > 0 ? 
              (plan.packages[0].amount || 0) : 0;
            const planTitle = (plan.title || '').toLowerCase();
            const planSlug = (plan.id || '').toLowerCase();
            const isUnlimited = (
              planCapacity === -1 ||
              planCapacity === 0 ||
              planCapacity === 'Unlimited' ||
              (typeof planCapacity === 'string' && planCapacity.toLowerCase().includes('unlimited')) ||
              planTitle.includes('unlimited') ||
              planSlug.includes('unlimited')
            );
            
            // Detect if this is an SMS package
            const hasText = plan.text === true || plan.text === 'true' || plan.text === 'yes';
            const hasVoice = plan.voice === true || plan.voice === 'true' || plan.voice === 'yes';
            const hasSMS = plan.sms === true || plan.sms === 'true' || plan.sms === 'yes';
            const hasSMSInName = planTitle.includes('sms') || planTitle.includes('text');
            const hasSMSInDesc = (plan.short_info || '').toLowerCase().includes('sms') || (plan.short_info || '').toLowerCase().includes('text');
            const isSMS = hasText || hasVoice || hasSMS || hasSMSInName || hasSMSInDesc;
            
            console.log(`✅ Processing valid plan: ${plan.title} (ID: ${plan.id}, Price: $${minPrice}, Countries: ${countryCodes.length}, Topup: ${isTopup}, Unlimited: ${isUnlimited}, SMS: ${isSMS})`);
            
            // Prepare common data fields
            const commonData = {
              slug: plan.id,
              name: plan.title,
              description: plan.short_info || '',
              price: minPrice,
              currency: 'USD',
              country_codes: countryCodes,
              country_ids: countryCodes,
              capacity: planCapacity,
              period: plan.packages && plan.packages.length > 0 ? 
                (plan.packages[0].day || 0) : 0,
              operator: plan.operator || '',
              status: 'active',
              updated_at: serverTimestamp(),
              synced_at: new Date().toISOString(),
              updated_by: 'airalo_sync',
              provider: 'airalo',
              is_roaming: plan.is_roaming || false,
              packages: plan.packages || [],
              countries: plan.countries || []
            };
            
            // Save topups to appropriate collection based on type
            if (isTopup) {
              const topupData = {
                ...commonData,
                is_topup: true
              };
              
              // If unlimited, save ONLY to topups-unlimited collection
              if (isUnlimited) {
                const unlimitedRef = doc(db, 'topups-unlimited', plan.id);
                unlimitedBatch.push(setDoc(unlimitedRef, { ...topupData, is_unlimited: true }, { merge: true }));
                console.log(`♾️ Saving unlimited topup ONLY to topups-unlimited collection: ${plan.title}`);
                allTopups.push({ ...plan, is_topup: true, is_unlimited: true });
                totalSynced.topups++;
                continue; // Skip saving to main topups collection
              }
              
              // If SMS, save ONLY to topups-sms collection
              if (isSMS) {
                const smsRef = doc(db, 'topups-sms', plan.id);
                smsBatch.push(setDoc(smsRef, { ...topupData, is_sms: true }, { merge: true }));
                console.log(`💬 Saving SMS topup ONLY to topups-sms collection: ${plan.title}`);
                allTopups.push({ ...plan, is_topup: true, is_sms: true });
                totalSynced.topups++;
                continue; // Skip saving to main topups collection
              }
              
              // Regular topup - save to topups collection
              const topupRef = doc(db, 'topups', plan.id);
              topupsBatch.push(setDoc(topupRef, topupData, { merge: true }));
              allTopups.push({ ...plan, is_topup: true });
              totalSynced.topups++; // Count topups separately
            } else {
              const planData = {
                ...commonData
              };
              
              // Re-check unlimited detection to be absolutely sure (double-check slug/name/ID)
              const checkId = String(plan.id || '').toLowerCase();
              const checkSlug = String(plan.slug || plan.id || '').toLowerCase();
              const checkName = String(plan.title || plan.name || '').toLowerCase();
              const finalIsUnlimited = isUnlimited || 
                                       checkId.includes('unlimited') || 
                                       checkSlug.includes('unlimited') || 
                                       checkName.includes('unlimited');
              
              // If unlimited, save ONLY to dataplans-unlimited collection
              if (finalIsUnlimited) {
                const unlimitedRef = doc(db, 'dataplans-unlimited', plan.id);
                unlimitedBatch.push(setDoc(unlimitedRef, { ...planData, is_unlimited: true }, { merge: true }));
                console.log(`♾️ Saving unlimited plan ONLY to dataplans-unlimited collection: ${plan.title} (ID: ${plan.id}, detected: ${finalIsUnlimited})`);
                totalSynced.packages++;
                continue; // Skip saving to main dataplans collection
              }
              
              // If SMS, save ONLY to dataplans-sms collection
              if (isSMS) {
                const smsRef = doc(db, 'dataplans-sms', plan.id);
                smsBatch.push(setDoc(smsRef, { ...planData, is_sms: true }, { merge: true }));
                console.log(`💬 Saving SMS plan ONLY to dataplans-sms collection: ${plan.title}`);
                totalSynced.packages++;
                continue; // Skip saving to main dataplans collection
              }
              
              // Regular plan - save to dataplans collection
              plansBatch.push(setDoc(planRef, planData, { merge: true }));
              totalSynced.packages++; // Count regular plans
            }
          }
        }
      }
      
      // Execute plans batch
      await Promise.all(plansBatch);
      console.log(`✅ Synced ${totalSynced.packages} plans to dataplans collection`);
      
      // Execute topups batch
      await Promise.all(topupsBatch);
      const topupsCount = totalSynced.topups; // Use the counter instead of allTopups.length
      console.log(`🔋 Synced ${topupsCount} topup packages to topups collection`);
      
      // Execute unlimited batch (separate collections)
      await Promise.all(unlimitedBatch);
      console.log(`♾️ Synced ${unlimitedBatch.length} unlimited packages to dataplans-unlimited and topups-unlimited collections`);
      
      // Execute SMS batch (separate collections)
      await Promise.all(smsBatch);
      console.log(`💬 Synced ${smsBatch.length} SMS packages to dataplans-sms and topups-sms collections`);
      
      // Now save all packages to Supabase esim_packages table
      if (supabaseAdmin && supabasePackagesArray.length > 0) {
        console.log(`💾 Saving ${supabasePackagesArray.length} packages to Supabase...`);
        let supabasePackagesSynced = 0;
        
        try {
          // Collect all packages for Supabase (both plans and topups)
          const supabasePackages = [];
          
          for (const pkg of supabasePackagesArray) {
            if (!pkg.id || !pkg.title) continue;
            
            // Get country_id from country code
            let countryId = null;
            if (pkg.country_codes && pkg.country_codes.length > 0) {
              // Get the first country code and find its ID
              const countryCode = pkg.country_codes[0];
              const country = countriesMap.get(countryCode);
              if (country && country.id) {
                countryId = country.id;
              } else {
                // Try to find country in Supabase
                const { data: countryData } = await supabaseAdmin
                  .from('esim_countries')
                  .select('id')
                  .eq('airalo_country_code', countryCode.toUpperCase())
                  .single();
                if (countryData) {
                  countryId = countryData.id;
                }
              }
            }
            
            // Determine package type
            let packageType = 'local';
            if (pkg.is_global || pkg.parent_category === 'global') {
              packageType = 'global';
            } else if (pkg.is_regional || pkg.parent_category === 'regional') {
              packageType = 'regional';
            }
            
            // Use already calculated price from the package (we stored it when adding to array)
            const retailPrice = pkg.price || 0;
            const originalPrice = pkg.original_price || 0;
            
            if (originalPrice === 0 || retailPrice === 0) {
              console.log(`⏭️ Skipping package with no price: ${pkg.title} (ID: ${pkg.id})`);
              continue;
            }
            
            // Use already detected flags from the package
            const isUnlimited = pkg.is_unlimited || false;
            const isSMS = pkg.is_sms || false;
            const isTopup = pkg.is_topup || false;
            
            const supabasePackage = {
              airalo_package_id: pkg.id,
              country_id: countryId,
              title: pkg.title,
              title_ru: pkg.short_info || null,
              data_amount: pkg.amount?.toString() || null,
              validity_days: pkg.day || null,
              price_usd: retailPrice,
              price_rub: Math.round(retailPrice * 100), // Approximate, should use exchange rate
              operator: pkg.operator || null,
              data_amount_mb: typeof pkg.amount === 'number' ? pkg.amount : null,
              rechargeability: isTopup ? 'rechargeable' : null,
              apn_type: null,
              apn_value: null,
              topups: isTopup ? [] : null,
              is_active: true,
              package_type: packageType,
              is_unlimited: isUnlimited,
              voice_included: pkg.voice || false,
              sms_included: isSMS,
              last_synced_at: new Date().toISOString()
            };
            
            supabasePackages.push(supabasePackage);
          }
          
          // Batch upsert to Supabase
          const batchSize = 50;
          for (let i = 0; i < supabasePackages.length; i += batchSize) {
            const batch = supabasePackages.slice(i, i + batchSize);
            
            const { error: upsertError } = await supabaseAdmin
              .from('esim_packages')
              .upsert(batch, {
                onConflict: 'airalo_package_id',
                ignoreDuplicates: false
              });
            
            if (upsertError) {
              console.error(`❌ Error upserting packages batch ${i / batchSize + 1}:`, upsertError);
              continue;
            }
            
            supabasePackagesSynced += batch.length;
            console.log(`✅ Upserted ${supabasePackagesSynced}/${supabasePackages.length} packages to Supabase...`);
          }
          
          console.log(`✅ Successfully synced ${supabasePackagesSynced} packages to Supabase esim_packages table`);
        } catch (supabaseError) {
          console.error('❌ Error syncing packages to Supabase:', supabaseError);
          // Don't fail the entire sync if Supabase save fails
        }
      } else if (supabasePackagesArray.length > 0 && !supabaseAdmin) {
        console.warn('⚠️ Supabase admin client not configured - skipping packages sync to Supabase');
      } else if (supabasePackagesArray.length === 0) {
        console.warn('⚠️ No packages collected for Supabase sync - supabasePackagesArray is empty');
      }
      
    } catch (error) {
      console.error('❌ Error syncing packages:', error);
      return NextResponse.json({
        success: false,
        error: `Error syncing packages: ${error.message}`
      }, { status: 500 });
    }
    
    // Topups are saved in topups collection, use the counter
    const finalTopupsSyncedCount = totalSynced.topups;
    
    // Create sync log
    const logRef = doc(collection(db, 'sync_logs'));
    await setDoc(logRef, {
      timestamp: serverTimestamp(),
      countries_synced: countriesSyncedCount,
      plans_synced: totalSynced.packages,
      topups_synced: finalTopupsSyncedCount,
      status: 'completed',
      source: 'admin_manual_sync',
      sync_type: 'plans_and_topups_sync',
      provider: 'airalo'
    });
    
    const totalPlans = totalSynced.packages;
    const totalTopups = totalSynced.topups;
    const totalPackages = totalPlans + totalTopups; // Total unique packages
    console.log(`🎉 Successfully synced: ${totalPlans} plans, ${totalTopups} topups (${totalPackages} total packages), and ${countriesSyncedCount} countries`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalPlans} plans, ${totalTopups} topups (${totalPackages} total packages), and ${countriesSyncedCount} countries from Airalo API`,
      total_synced: totalPackages + countriesSyncedCount,
      plans: [], // Empty array since plans are saved directly to Firestore
      countries: [], // Empty array since countries are saved directly to Firestore
      details: {
        plans_synced: totalSynced.packages,
        topups_synced: totalSynced.topups,
        total_packages: totalSynced.packages + totalSynced.topups,
        countries_synced: countriesSyncedCount
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
