import { 
  collection, 
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

// Get all plans from Firebase (only enabled and visible plans)
export const getAllPlans = async () => {
  try {
    const plansSnapshot = await getDocs(collection(db, 'dataplans'));
    const allPlans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter out disabled and hidden plans
    // enabled !== false means enabled by default
    // hidden !== true means visible by default
    const visiblePlans = allPlans.filter(plan => 
      plan.enabled !== false && plan.hidden !== true
    );
    
    return visiblePlans;
  } catch (error) {
    console.error('Error getting all plans:', error);
    throw error;
  }
};

// Get plans count
export const getPlansCount = async () => {
  try {
    const plansSnapshot = await getDocs(collection(db, 'dataplans'));
    return plansSnapshot.size;
  } catch (error) {
    console.error('Error getting plans count:', error);
    return 0;
  }
};

// Get countries with real pricing from Firebase (same logic as admin dashboard)
export const getCountriesWithPricing = async () => {
  try {
    // Get all countries
    const countriesSnapshot = await getDocs(collection(db, 'countries'));
    const countries = countriesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          flagEmoji: data.flagEmoji || getFlagEmoji(data.code)
        };
      })
      // Filter out hidden countries (hidden !== true means visible by default)
      .filter(country => country.hidden !== true);
    
    // Get all plans (already filtered for enabled plans)
    const allPlans = await getAllPlans();
    
    console.log('🔍 All enabled plans loaded for countries:', allPlans.length);
    console.log('🔍 Sample plan data:', allPlans.slice(0, 3).map(p => ({ 
      id: p.id, 
      name: p.name, 
      price: p.price, 
      country_codes: p.country_codes,
      country_ids: p.country_ids 
    })));
    
    // Calculate minimum price for each country using the same logic as admin dashboard
    const countriesWithPricing = countries.map(country => {
      // Find plans for this country using the same logic as admin dashboard
      const countryPlans = allPlans.filter(plan => {
        // Check if plan has country_codes array and includes this country's code
        if (plan.country_codes && Array.isArray(plan.country_codes)) {
          return plan.country_codes.includes(country.code);
        }
        // Check if plan has country_ids array and includes this country's code
        if (plan.country_ids && Array.isArray(plan.country_ids)) {
          return plan.country_ids.includes(country.code);
        }
        // Check if plan has country field matching country name
        if (plan.country) {
          return plan.country === country.name;
        }
        return false;
      });
      
      // Calculate minimum price
      const minPrice = countryPlans.length > 0 
        ? Math.min(...countryPlans.map(plan => parseFloat(plan.price) || 999))
        : 999;
      
      return {
        ...country,
        minPrice: minPrice,
        plansCount: countryPlans.length,
        plans: countryPlans // Include the actual plans for filtering
      };
    });
    
    console.log('✅ Countries with pricing calculated:', countriesWithPricing.length);
    return countriesWithPricing;
  } catch (error) {
    console.error('Error getting countries with pricing:', error);
    throw error;
  }
};

// Get pricing statistics (only enabled plans)
export const getPricingStats = async () => {
  try {
    const allPlans = await getAllPlans(); // Already filtered for enabled plans
    
    if (allPlans.length === 0) {
      return {
        totalPlans: 0,
        totalCountries: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0
      };
    }
    
    const prices = allPlans.map(plan => parseFloat(plan.price) || 0).filter(price => price > 0);
    const countries = new Set();
    
    allPlans.forEach(plan => {
      if (plan.country_codes) {
        plan.country_codes.forEach(code => countries.add(code));
      }
      if (plan.country_ids) {
        plan.country_ids.forEach(id => countries.add(id));
      }
      if (plan.country) {
        countries.add(plan.country);
      }
    });
    
    return {
      totalPlans: allPlans.length,
      totalCountries: countries.size,
      averagePrice: prices.length > 0 ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2) : 0,
      minPrice: prices.length > 0 ? Math.min(...prices).toFixed(2) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices).toFixed(2) : 0
    };
  } catch (error) {
    console.error('Error getting pricing stats:', error);
    throw error;
  }
};
