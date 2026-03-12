export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getCountriesWithPricing } from '../../../../src/services/plansService';

/**
 * Public API for the mobile app (Expo).
 * Returns countries with min price and plan count.
 * Response shape: { data: { countries: [...] } } for compatibility with mobile useCountries().
 */
export async function GET() {
  try {
    const countriesWithPricing = await getCountriesWithPricing();

    const countries = (countriesWithPricing || [])
      .filter((c) => c.plansCount > 0 && (c.minPrice == null || c.minPrice < 999))
      .map((c) => ({
        id: c.id || c.code,
        code: c.code || c.id,
        name: c.name || c.country_name || c.code,
        name_ru: c.name_ru || c.country_name_ru || c.name || c.code,
        flag: c.flag || c.flag_url || '',
        flagUrl: c.flag_url || c.flag || '',
        minPrice: typeof c.minPrice === 'number' ? c.minPrice : 0,
        minPriceRub: typeof c.minPriceRub === 'number' ? c.minPriceRub : c.minPrice,
        plansCount: c.plansCount ?? c.planCount ?? 0,
        type: 'country',
      }));

    return NextResponse.json({
      data: { countries },
      countries,
      total: countries.length,
    });
  } catch (error) {
    console.error('❌ [api/public/countries] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
