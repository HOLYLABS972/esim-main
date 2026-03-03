'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Flag, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { getCountriesWithPricing } from '../../services/plansService';
import { translateCountries } from '../../utils/countryTranslations';
import { useI18n } from '../../contexts/I18nContext';

import { supabase } from '../../supabase/config';

// Tier definitions for grouping plans
const DATA_TIERS = [
  { label: '1 GB', min: 1, max: 1.9 },
  { label: '2 GB', min: 2, max: 2.9 },
  { label: '3 GB', min: 3, max: 4.9 },
  { label: '5 GB', min: 5, max: 9.9 },
  { label: '10 GB', min: 10, max: 19.9 },
  { label: '20 GB', min: 20, max: 49.9 },
  { label: '50 GB', min: 50, max: 999 },
];

const UNLIMITED_TIER = { label: 'Unlimited', min: Infinity, max: Infinity };

// Sub-region definitions
const SUB_REGIONS = [
  { key: 'global', label: 'Global', labelRu: 'Глобальный' },
  { key: 'europe', label: 'Europe', labelRu: 'Европа' },
  { key: 'asia', label: 'Asia', labelRu: 'Азия' },
  { key: 'north-america', label: 'North America', labelRu: 'Северная Америка' },
  { key: 'latin-america', label: 'Latin America', labelRu: 'Латинская Америка' },
  { key: 'middle-east', label: 'Middle East', labelRu: 'Ближний Восток' },
  { key: 'africa', label: 'Africa', labelRu: 'Африка' },
  { key: 'oceania', label: 'Oceania', labelRu: 'Океания' },
];

// Map various region identifiers to sub-region keys
const regionToSubRegion = (plan) => {
  if (plan.is_global === true || plan.type === 'global' || plan.region === 'global') {
    return 'global';
  }

  const slug = (plan.slug || plan.name || plan.title || '').toLowerCase();
  const region = (plan.region || '').toLowerCase();
  const combined = `${slug} ${region}`;

  if (combined.includes('europe') || combined.includes('eurolink') || combined.includes('euconnect') || combined.includes('eu-') || region === 'eu') return 'europe';
  if (combined.includes('asia') || combined.includes('asean')) return 'asia';
  if (combined.includes('latin') || combined.includes('latam') || combined.includes('south-america') || combined.includes('central-america') || combined.includes('caribbean')) return 'latin-america';
  if (combined.includes('north-america') || combined.includes('americanmex') || combined.includes('america-mexico') || combined.includes('us-mx') || combined.includes('usa-mexico')) return 'north-america';
  if (combined.includes('americas')) return 'north-america';
  if (combined.includes('middle-east') || combined.includes('mena') || combined.includes('gcc')) return 'middle-east';
  if (combined.includes('africa') || combined.includes('safarilink')) return 'africa';
  if (combined.includes('oceania') || combined.includes('oceanlink') || combined.includes('pacific')) return 'oceania';

  // Fallback: try to infer from country codes
  const codes = plan.country_codes || [];
  if (codes.length > 0) {
    if (codes.some(c => ['US', 'CA', 'MX'].includes(c))) return 'north-america';
    if (codes.some(c => ['AU', 'NZ', 'FJ'].includes(c))) return 'oceania';
    if (codes.some(c => ['AE', 'SA', 'KW', 'QA'].includes(c))) return 'middle-east';
  }

  return 'europe'; // default fallback
};

// Parse data amount in GB from plan
const getDataGB = (plan) => {
  if (plan.is_unlimited) return Infinity;
  const d = plan.data || plan.amount || '';
  if (typeof d === 'number') return d >= 100 ? d / 1024 : d; // if MB convert
  if (typeof d !== 'string') return 0;
  const gb = d.match(/(\d+(?:\.\d+)?)\s*GB/i);
  if (gb) return parseFloat(gb[1]);
  const mb = d.match(/(\d+)\s*MB/i);
  if (mb) return parseInt(mb[1], 10) / 1024;
  // Try bare number
  const num = parseFloat(d);
  if (!isNaN(num) && num > 0) return num;
  if (d.toLowerCase().includes('unlimited') || d.toLowerCase().includes('безлимит')) return Infinity;
  return 0;
};

// Check if plan is a topup
const isTopup = (plan) => {
  const id = (plan.id || '').toLowerCase();
  const slug = (plan.slug || '').toLowerCase();
  const type = (plan.type || '').toLowerCase();
  const name = (plan.name || plan.title || '').toLowerCase();
  return type === 'topup' || id.includes('-topup') || id.includes('topup') ||
    slug.includes('-topup') || slug.includes('topup') ||
    name.includes('topup') || name.includes('top-up') || name.includes('top up');
};

export default function AiraloPackagesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('countries');
  const [selectedSubRegion, setSelectedSubRegion] = useState('global');

  // Countries tab state
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  // All global+regional plans for Regions tab
  const [allRegionPlans, setAllRegionPlans] = useState([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetchPackages();
    fetchCountries();
  }, [locale]);

  useEffect(() => {
    if (!mounted) return;
    const urlSearchTerm = searchParams?.get('search') || '';
    setSearchTerm(urlSearchTerm);
    if (urlSearchTerm) setActiveTab('countries');
  }, [searchParams, mounted]);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCountries(countries.filter(country =>
        country.name.toLowerCase().includes(term) || country.code.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, countries]);

  useEffect(() => {
    if (activeTab === 'countries' && countries.length === 0) fetchCountries();
  }, [activeTab]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: plansData, error: plansErr } = await supabase
        .from('dataplans')
        .select('*')
        .eq('status', 'active')
        .eq('enabled', true)
        .eq('hidden', false)
        .order('price', { ascending: true });

      if (plansErr) throw plansErr;
      const allPlans = [];

      for (const planData of (plansData || [])) {
        const plan = { id: planData.id, ...planData };

        // Filter by locale for non-English
        if (locale && locale !== 'en') {
          const supportedLanguages = planData.supported_languages || [];
          const isGlobal = planData.is_global === true || planData.type === 'global' || planData.region === 'global';
          const isRegional = planData.is_regional === true || planData.type === 'regional';

          if (isGlobal) {
            allPlans.push(plan);
          } else if (isRegional && (supportedLanguages.length === 0 || supportedLanguages.includes(locale))) {
            allPlans.push(plan);
          } else if (!isGlobal && !isRegional) {
            allPlans.push(plan);
          }
        } else {
          allPlans.push(plan);
        }
      }

      // Separate global+regional plans for the Regions tab
      const regionPlans = allPlans.filter(p => {
        if (isTopup(p)) return false;
        return p.is_global === true || p.type === 'global' || p.region === 'global' ||
          p.is_regional === true || p.type === 'regional';
      });
      setAllRegionPlans(regionPlans);
      setPackages({ plans: allPlans });
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const countriesWithPricing = await getCountriesWithPricing();
      let countriesWithRealPricing = countriesWithPricing.filter(country =>
        country.minPrice < 999 && country.plansCount > 0
      );
      const genericIcons = ['🌍', '🗺️', '🌏', '🌎'];
      countriesWithRealPricing = countriesWithRealPricing.filter(country => {
        const flag = country.flagEmoji || '';
        return flag && !genericIcons.includes(flag);
      });
      countriesWithRealPricing.sort((a, b) => {
        if (b.plansCount !== a.plansCount) return b.plansCount - a.plansCount;
        return a.minPrice - b.minPrice;
      });
      const popularDestinations = countriesWithRealPricing.slice(0, 10);
      const translatedCountries = translateCountries(popularDestinations, locale);
      setCountries(translatedCountries);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleCountrySelect = async (country) => {
    try {
      const { data: plansResult } = await supabase
        .from('dataplans')
        .select('*')
        .contains('country_codes', [country.code])
        .eq('enabled', true)
        .eq('hidden', false);
      const plans = plansResult || [];

      const oneGBPlan = plans
        .filter(p => parseFloat(p.data) === 1)
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const fallbackPlan = plans.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const targetPlan = oneGBPlan || fallbackPlan;

      if (targetPlan) {
        const countryFlag = country.flagEmoji || '🌍';
        let targetUrl = `/share-package/${targetPlan.id}?country=${country.code}&flag=${countryFlag}`;
        if (locale && locale !== 'en') targetUrl = `/${locale}${targetUrl}`;
        router.push(targetUrl);
      }
    } catch (error) {
      console.error('Error finding plans:', error);
    }
  };

  const handlePackageClick = (packageId) => {
    if (!packageId) return;
    let targetUrl = '/share-package/' + packageId;
    if (locale && locale !== 'en') targetUrl = `/${locale}${targetUrl}`;
    router.push(targetUrl);
  };

  // Compute tiered plans per sub-region
  const tieredPlansByRegion = useMemo(() => {
    const result = {};

    // Group plans by sub-region
    const grouped = {};
    allRegionPlans.forEach(plan => {
      const sr = regionToSubRegion(plan);
      if (!grouped[sr]) grouped[sr] = [];
      grouped[sr].push(plan);
    });

    // For each sub-region, compute tiers
    for (const [sr, plans] of Object.entries(grouped)) {
      const tiers = [];

      // Regular data tiers
      for (const tier of DATA_TIERS) {
        const matching = plans.filter(p => {
          const gb = getDataGB(p);
          return gb >= tier.min && gb <= tier.max && gb !== Infinity;
        });
        if (matching.length === 0) continue;
        // Pick cheapest: sort by validity ascending, then price ascending
        matching.sort((a, b) => {
          const va = parseFloat(a.validity || a.validity_days || 999);
          const vb = parseFloat(b.validity || b.validity_days || 999);
          if (va !== vb) return va - vb;
          return parseFloat(a.price || 999) - parseFloat(b.price || 999);
        });
        tiers.push({ ...tier, plan: matching[0] });
      }

      // Unlimited tier
      const unlimitedPlans = plans.filter(p => getDataGB(p) === Infinity);
      if (unlimitedPlans.length > 0) {
        unlimitedPlans.sort((a, b) => {
          const va = parseFloat(a.validity || a.validity_days || 999);
          const vb = parseFloat(b.validity || b.validity_days || 999);
          if (va !== vb) return va - vb;
          return parseFloat(a.price || 999) - parseFloat(b.price || 999);
        });
        tiers.push({ ...UNLIMITED_TIER, plan: unlimitedPlans[0] });
      }

      if (tiers.length > 0) {
        result[sr] = tiers.slice(0, 8);
      }
    }

    return result;
  }, [allRegionPlans]);

  // Available sub-regions (only those with plans)
  const availableSubRegions = useMemo(() => {
    return SUB_REGIONS.filter(sr => tieredPlansByRegion[sr.key]?.length > 0);
  }, [tieredPlansByRegion]);

  // Auto-select first available sub-region
  useEffect(() => {
    if (activeTab === 'regions' && availableSubRegions.length > 0) {
      if (!tieredPlansByRegion[selectedSubRegion]) {
        setSelectedSubRegion(availableSubRegions[0].key);
      }
    }
  }, [activeTab, availableSubRegions, tieredPlansByRegion]);

  const isRu = locale === 'ru';

  const getSubRegionLabel = (sr) => isRu ? sr.labelRu : sr.label;

  const formatData = (plan) => {
    const gb = getDataGB(plan);
    if (gb === Infinity) return isRu ? 'Безлимит' : 'Unlimited';
    if (gb >= 1) return `${Math.round(gb)} GB`;
    return `${Math.round(gb * 1024)} MB`;
  };

  const formatValidity = (plan) => {
    const days = parseInt(plan.validity || plan.validity_days || 0, 10);
    if (!days) return '';
    if (isRu) return `${days} дн.`;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-tufts-blue mx-auto mb-4" />
            <p className="text-gray-600">{isRu ? 'Загрузка...' : 'Loading packages...'}</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button onClick={fetchPackages} className="mt-4 px-4 py-2 bg-tufts-blue text-white rounded-lg hover:bg-tufts-blue-dark">
              {isRu ? 'Попробовать снова' : 'Try Again'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!packages) return null;

  return (
    <section className="bg-transparent">
      <div className="container mx-auto px-4">
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('countries'); }}
            className={`inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${
              activeTab === 'countries'
                ? 'bg-tufts-blue text-white shadow-md shadow-tufts-blue/30'
                : 'bg-white text-gray-700 hover:bg-tufts-blue/10 hover:text-tufts-blue border border-gray-200 hover:border-tufts-blue/20'
            }`}
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            <span>{isRu ? 'Популярные направления' : 'Popular Destinations'}</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'countries' ? 'bg-tufts-blue-dark text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {countries.length || 0}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('regions'); }}
            className={`inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${
              activeTab === 'regions'
                ? 'bg-tufts-blue text-white shadow-md shadow-tufts-blue/30'
                : 'bg-white text-gray-700 hover:bg-tufts-blue/10 hover:text-tufts-blue border border-gray-200 hover:border-tufts-blue/20'
            }`}
          >
            <Globe className="w-3.5 h-3.5 mr-1" />
            <span>{isRu ? 'Регионы' : 'Regions'}</span>
            {availableSubRegions.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'regions' ? 'bg-tufts-blue-dark text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {availableSubRegions.length}
              </span>
            )}
          </button>
        </div>

        {/* Countries Tab */}
        {activeTab === 'countries' && (
          <div>
            {loadingCountries ? (
              <div className="flex justify-center items-center min-h-64">
                <Loader2 className="w-8 h-8 animate-spin text-tufts-blue mr-4" />
                <p className="text-gray-600">{isRu ? 'Загрузка стран...' : 'Loading countries...'}</p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                {searchTerm ? `${isRu ? 'Страны не найдены по запросу' : 'No countries found matching'} "${searchTerm}"` : (isRu ? 'Нет доступных стран' : 'No countries available')}
              </div>
            ) : (
              <div>
                {!searchTerm && (
                  <div className="text-center mb-4">
                    <p className="text-gray-600 text-sm mb-2">
                      {isRu ? 'Топ 10 популярных направлений' : 'Top 10 popular travel destinations'}
                    </p>
                    <Link
                      href={locale && locale !== 'en' ? `/${locale}/esim-plans` : '/esim-plans'}
                      className="text-tufts-blue text-sm font-medium hover:underline"
                    >
                      {isRu ? 'Все направления →' : 'View all destinations →'}
                    </Link>
                  </div>
                )}
                {searchTerm && (
                  <div className="mb-4 text-center text-gray-600 text-sm">
                    {isRu ? `Найдено ${filteredCountries.length} стран по запросу "${searchTerm}"` : `Found ${filteredCountries.length} ${filteredCountries.length === 1 ? 'country' : 'countries'} matching "${searchTerm}"`}
                  </div>
                )}
                <div className="space-y-2">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.id || country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-6 py-4 bg-transparent rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-tufts-blue/20 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {country.flagEmoji ? (
                            <span className="text-2xl">{country.flagEmoji}</span>
                          ) : (
                            <Flag className="w-8 h-8 text-tufts-blue" />
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                          <p className="text-sm text-gray-500">1GB • 7 Days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {country.minPrice && country.minPrice < 999 ? (
                          <div className="text-lg font-semibold text-gray-900">
                            ${country.minPrice.toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-lg font-medium text-gray-500">{isRu ? 'Нет планов' : 'No plans'}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regions Tab */}
        {activeTab === 'regions' && (
          <div>
            {/* Sub-region chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {availableSubRegions.map((sr) => (
                <button
                  key={sr.key}
                  onClick={() => setSelectedSubRegion(sr.key)}
                  className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${
                    selectedSubRegion === sr.key
                      ? 'bg-tufts-blue text-white shadow-md shadow-tufts-blue/30'
                      : 'bg-white text-gray-700 hover:bg-tufts-blue/10 hover:text-tufts-blue border border-gray-200 hover:border-tufts-blue/20'
                  }`}
                >
                  {sr.key === 'global' && <span className="mr-1">🌍</span>}
                  {getSubRegionLabel(sr)}
                </button>
              ))}
            </div>

            {/* Tiered plans for selected sub-region */}
            {tieredPlansByRegion[selectedSubRegion] ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tieredPlansByRegion[selectedSubRegion].map((tier, idx) => {
                  const plan = tier.plan;
                  const price = parseFloat(plan.price || 0);
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-gray-100 hover:border-tufts-blue/30 hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatData(plan)}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            {formatValidity(plan)}
                          </span>
                        </div>
                        {plan.name && (
                          <p className="text-xs text-gray-400 mb-2 truncate">{plan.name}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-tufts-blue">
                          ${price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handlePackageClick(plan.id)}
                          className="px-4 py-2 bg-tufts-blue text-white text-sm font-medium rounded-lg hover:bg-tufts-blue-dark transition-colors"
                        >
                          {isRu ? 'Купить' : 'Buy'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                {isRu ? 'Нет доступных планов для этого региона' : 'No plans available for this region'}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
