import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    const limit = parseInt(searchParams.get('limit')) || 50;

    console.log('📱 Fetching plans from Firestore...');

    let plansQuery = query(
      collection(db, 'plans'),
      where('status', '==', 'active'),
      orderBy('price', 'asc')
    );

    // If country filter is provided
    if (countryCode) {
      plansQuery = query(
        collection(db, 'plans'),
        where('status', '==', 'active'),
        where('country_codes', 'array-contains', countryCode.toUpperCase()),
        orderBy('price', 'asc')
      );
    }

    const plansSnapshot = await getDocs(plansQuery);
    const plans = [];

    plansSnapshot.forEach((doc) => {
      const planData = doc.data();
      plans.push({
        id: doc.id,
        ...planData
      });
    });

    // Limit results
    const limitedPlans = plans.slice(0, limit);

    console.log(`✅ Found ${limitedPlans.length} plans`);

    return NextResponse.json({
      success: true,
      plans: limitedPlans,
      total: plans.length,
      message: 'Plans retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
