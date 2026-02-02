export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit')) || 100;

    console.log('🌍 Fetching regional eSIMs from Firestore...');

    // Query all active plans
    const plansQuery = query(
      collection(db, 'dataplans'),
      where('status', '==', 'active'),
      orderBy('price', 'asc')
    );

    const plansSnapshot = await getDocs(plansQuery);
    const regionalPlans = [];

    plansSnapshot.forEach((doc) => {
      const planData = doc.data();
      
      // Identify regional plans:
      // 1. Has type === 'regional'
      // 2. Has region field set
      // 3. Has multiple country_codes (2-5 countries typically)
      // 4. Name/title includes regional keywords
      const countryCodes = planData.country_codes || [];
      const planType = planData.type || '';
      const planRegion = planData.region || planData.region_slug || '';
      const planName = (planData.name || planData.title || '').toLowerCase();
      
      const isRegional = 
        planType === 'regional' ||
        (planRegion && planRegion !== 'global') ||
        (countryCodes.length >= 2 && countryCodes.length <= 10 && !planName.includes('global')) ||
        planName.includes('regional') ||
        planName.includes('europe') ||
        planName.includes('asia') ||
        planName.includes('america') ||
        planName.includes('africa') ||
        planName.includes('middle east');

      if (isRegional) {
        // Filter by specific region if provided
        if (regionCode) {
          const regionMatch = 
            planRegion?.toLowerCase() === regionCode.toLowerCase() ||
            planName.includes(regionCode.toLowerCase());
          
          if (regionMatch) {
            regionalPlans.push({
              id: doc.id,
              ...planData
            });
          }
        } else {
          regionalPlans.push({
            id: doc.id,
            ...planData
          });
        }
      }
    });

    // Limit results
    const limitedPlans = regionalPlans.slice(0, limit);

    console.log(`✅ Found ${limitedPlans.length} regional eSIMs`);

    return NextResponse.json({
      success: true,
      plans: limitedPlans,
      total: regionalPlans.length,
      message: 'Regional eSIMs retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching regional eSIMs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

