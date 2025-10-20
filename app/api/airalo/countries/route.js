export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '../../../../src/firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;

    console.log('🌍 Fetching countries from Firestore...');

    const countriesQuery = query(
      collection(db, 'countries'),
      where('status', '==', 'active'),
      orderBy('name', 'asc')
    );

    const countriesSnapshot = await getDocs(countriesQuery);
    const countries = [];

    countriesSnapshot.forEach((doc) => {
      const countryData = doc.data();
      countries.push({
        id: doc.id,
        ...countryData
      });
    });

    // Limit results
    const limitedCountries = countries.slice(0, limit);

    console.log(`✅ Found ${limitedCountries.length} countries`);

    return NextResponse.json({
      success: true,
      countries: limitedCountries,
      total: countries.length,
      message: 'Countries retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching countries:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
