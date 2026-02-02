export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;

    console.log('🌐 Fetching global eSIMs from Firestore...');

    // Query all active plans
    const plansQuery = query(
      collection(db, 'dataplans'),
      where('status', '==', 'active'),
      orderBy('price', 'asc')
    );

    const plansSnapshot = await getDocs(plansQuery);
    const globalPlans = [];

    plansSnapshot.forEach((doc) => {
      const planData = doc.data();
      
      // Identify global plans:
      // 1. Has type === 'global' or 'multi-country'
      // 2. Has region === 'global'
      // 3. Has many country_codes (>10 countries typically)
      // 4. Name/title includes 'global'
      const countryCodes = planData.country_codes || [];
      const planType = planData.type || '';
      const planRegion = planData.region || planData.region_slug || '';
      const planName = (planData.name || planData.title || '').toLowerCase();
      
      const isGlobal = 
        planType === 'global' ||
        planType === 'multi-country' ||
        planRegion === 'global' ||
        countryCodes.length > 10 ||
        planName.includes('global') ||
        planName.includes('worldwide') ||
        planName.includes('world');

      if (isGlobal) {
        globalPlans.push({
          id: doc.id,
          ...planData
        });
      }
    });

    // Limit results
    const limitedPlans = globalPlans.slice(0, limit);

    console.log(`✅ Found ${limitedPlans.length} global eSIMs`);

    return NextResponse.json({
      success: true,
      plans: limitedPlans,
      total: globalPlans.length,
      message: 'Global eSIMs retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching global eSIMs:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

