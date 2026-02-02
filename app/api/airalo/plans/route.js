export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirestore } from '../../../lib/firebaseAdmin';

export async function GET(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({
      success: false,
      error: 'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY in .env.local'
    }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');
    const limitParam = parseInt(searchParams.get('limit')) || 5000;
    const activeOnly = searchParams.get('active_only') !== 'false';

    console.log('📱 Fetching plans from Firestore...', { countryCode, limit: limitParam, activeOnly });

    // Fetch all plans from dataplans collection
    const plansRef = db.collection('dataplans');
    let plansSnapshot = await plansRef.get();

    let allPlans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also fetch from dataplans-unlimited and dataplans-sms
    const unlimitedSnapshot = await db.collection('dataplans-unlimited').get();
    const smsSnapshot = await db.collection('dataplans-sms').get();
    
    allPlans = allPlans.concat(unlimitedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _collection: 'dataplans-unlimited'
    })));
    
    allPlans = allPlans.concat(smsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _collection: 'dataplans-sms'
    })));

    // Filter by country if specified
    if (countryCode) {
      allPlans = allPlans.filter(plan => {
        const countryCodes = plan.country_codes || [];
        return countryCodes.includes(countryCode.toUpperCase());
      });
    }

    // Filter by active status if specified
    if (activeOnly) {
      allPlans = allPlans.filter(plan => plan.enabled !== false && plan.hidden !== true);
    }

    // Apply limit
    if (limitParam > 0) {
      allPlans = allPlans.slice(0, limitParam);
    }

    // Transform to match expected format
    const formattedPlans = allPlans.map(plan => ({
      id: plan.id,
      slug: plan.slug || plan.id,
      name: plan.name || plan.title || '',
      title: plan.title || plan.name || '',
      description: plan.description || '',
      price: parseFloat(plan.price) || 0,
      price_usd: parseFloat(plan.price) || 0,
      capacity: parseInt(plan.capacity) || 0,
      data_amount: plan.data_amount || `${plan.capacity || 0}MB`,
      data_amount_mb: parseInt(plan.capacity) || 0,
      period: parseInt(plan.period) || 0,
      validity_days: parseInt(plan.period) || 0,
      operator: plan.operator || '',
      is_active: plan.enabled !== false && plan.hidden !== true,
      status: (plan.enabled !== false && plan.hidden !== true) ? 'active' : 'inactive',
      package_type: plan.type || 'local',
      is_unlimited: plan.is_unlimited || false,
      voice_included: plan.voice_included || false,
      sms_included: plan.sms_included || false,
      country_codes: plan.country_codes || [],
      rechargeability: plan.is_topup ? 'rechargeable' : null,
      is_topup: plan.is_topup || false,
      topups: plan.topups || null,
      _collection: plan._collection || 'dataplans'
    }));

    console.log(`✅ Found ${formattedPlans.length} plans from Firestore`);

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
      total: formattedPlans.length,
      message: 'Plans retrieved successfully from Firestore'
    });

  } catch (error) {
    console.error('❌ Error fetching plans from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
