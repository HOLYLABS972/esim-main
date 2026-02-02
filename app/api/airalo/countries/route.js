export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirestore } from '../../../lib/firebaseAdmin';

export async function DELETE(request) {
  const db = getFirestore();
  if (!db) {
    return NextResponse.json({
      success: false,
      error: 'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY in .env.local'
    }, { status: 503 });
  }
  try {
    console.log('🗑️ Deleting all countries and plans from Firestore...');

    // Get counts before deletion
    const countriesSnapshot = await db.collection('countries').get();
    const plansSnapshot = await db.collection('dataplans').get();
    const unlimitedSnapshot = await db.collection('dataplans-unlimited').get();
    const smsSnapshot = await db.collection('dataplans-sms').get();

    const countriesCount = countriesSnapshot.size;
    const plansCount = plansSnapshot.size + unlimitedSnapshot.size + smsSnapshot.size;

    console.log(`📊 Found ${countriesCount} countries and ${plansCount} plans to delete`);

    // Delete all plans using batch
    const batch = db.batch();
    plansSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    unlimitedSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    smsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    countriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    console.log(`✅ Deleted ${countriesCount} countries and ${plansCount} plans`);

    return NextResponse.json({
      success: true,
      message: 'All countries and plans deleted successfully from Firestore',
      deleted: {
        countries: countriesCount,
        packages: plansCount
      }
    });

  } catch (error) {
    console.error('❌ Error deleting countries and plans:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

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
    const limitParam = parseInt(searchParams.get('limit')) || 500;

    console.log('🌍 Fetching countries from Firestore...');

    const countriesSnapshot = await db.collection('countries').get();
    const countries = countriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: doc.id,
        name: data.name || data.country_name || doc.id,
        flag: data.flag || data.flag_url || '',
        flag_url: data.flag || data.flag_url || '',
        is_visible: data.hidden !== true,
        status: data.hidden !== true ? 'active' : 'inactive',
        country_name: data.name || data.country_name || doc.id,
        airalo_country_code: doc.id
      };
    });

    // Filter visible and apply limit
    const visibleCountries = countries.filter(c => c.is_visible);
    const limitedCountries = limitParam > 0 ? visibleCountries.slice(0, limitParam) : visibleCountries;

    console.log(`✅ Found ${limitedCountries.length} countries from Firestore`);

    return NextResponse.json({
      success: true,
      countries: limitedCountries,
      total: limitedCountries.length,
      message: 'Countries retrieved successfully from Firestore'
    });

  } catch (error) {
    console.error('❌ Error fetching countries from Firestore:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
