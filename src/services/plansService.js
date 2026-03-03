import { supabase } from '../supabase/config';
import { getFlagEmoji } from '../utils/countryFlags';

// Get all plans from Supabase (only enabled and visible plans)
export const getAllPlans = async () => {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('dataplans')
      .select('*')
      .eq('enabled', true)
      .eq('hidden', false);

    if (error) {
      console.error('Error getting all plans:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all plans:', error);
    throw error;
  }
};

// Get plans count
export const getPlansCount = async () => {
  try {
    if (!supabase) return 0;

    const { count, error } = await supabase
      .from('dataplans')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  } catch (error) {
    console.error('Error getting plans count:', error);
    return 0;
  }
};

// Get countries with real pricing from Supabase
export const getCountriesWithPricing = async () => {
  try {
    if (!supabase) return [];

    // Get all visible countries
    const { data: countries, error: cErr } = await supabase
      .from('countries')
      .select('*')
      .eq('hidden', false);

    if (cErr) throw cErr;

    // Get all enabled plans
    const allPlans = await getAllPlans();

    console.log('🔍 All enabled plans loaded for countries:', allPlans.length);

    // Calculate minimum price for each country
    const countriesWithPricing = (countries || []).map(country => {
      const countryPlans = allPlans.filter(plan => {
        if (plan.country_codes && Array.isArray(plan.country_codes)) {
          return plan.country_codes.includes(country.code);
        }
        if (plan.country_ids && Array.isArray(plan.country_ids)) {
          return plan.country_ids.includes(country.code);
        }
        return false;
      });

      const minPrice = countryPlans.length > 0
        ? Math.min(...countryPlans.map(plan => parseFloat(plan.price) || 999))
        : 999;

      return {
        ...country,
        flagEmoji: getFlagEmoji(country.code),
        minPrice,
        plansCount: countryPlans.length,
        plans: countryPlans,
        planCount: country.plan_count || countryPlans.length,
      };
    });

    console.log('✅ Countries with pricing calculated:', countriesWithPricing.length);
    return countriesWithPricing;
  } catch (error) {
    console.error('Error getting countries with pricing:', error);
    throw error;
  }
};

// Get pricing statistics
export const getPricingStats = async () => {
  try {
    const allPlans = await getAllPlans();

    if (allPlans.length === 0) {
      return { totalPlans: 0, totalCountries: 0, averagePrice: 0, minPrice: 0, maxPrice: 0 };
    }

    const prices = allPlans.map(p => parseFloat(p.price) || 0).filter(p => p > 0);
    const countries = new Set();
    allPlans.forEach(plan => {
      (plan.country_codes || []).forEach(code => countries.add(code));
      (plan.country_ids || []).forEach(id => countries.add(id));
    });

    return {
      totalPlans: allPlans.length,
      totalCountries: countries.size,
      averagePrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices).toFixed(2) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices).toFixed(2) : 0,
    };
  } catch (error) {
    console.error('Error getting pricing stats:', error);
    throw error;
  }
};
