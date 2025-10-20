"use client";

import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { esimService } from '../services/esimService';
import { translateCountries } from '../utils/countryTranslations';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Wifi, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const AiraloPlans = () => {
  const { t, locale } = useI18n();
  const [packages, setPackages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price'); // price, data, validity, name

  // Load packages and countries on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter packages based on search and filters
  useEffect(() => {
    let filtered = packages;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(pkg => 
        pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.country_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(pkg => pkg.country_code === selectedCountry);
    }

    // Filter by region
    if (selectedRegion) {
      filtered = filtered.filter(pkg => pkg.region_slug === selectedRegion);
    }

    // Sort packages
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'data':
          return b.data - a.data;
        case 'validity':
          return b.validity - a.validity;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPackages(filtered);
  }, [packages, searchTerm, selectedCountry, selectedRegion, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await esimService.fetchPlans();
      
      if (result.success) {
        setPackages(result.plans || []);
        // Translate countries based on current locale
        const translatedCountries = translateCountries(result.countries || [], locale);
        setCountries(translatedCountries);
        console.log('✅ Loaded packages and countries from Airalo API');
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error(`Failed to load packages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (packageData) => {
    // Navigate to the share package page using the package slug as ID
    window.location.href = `/share-package/${packageData.slug}`;
  };


  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) {
      return 'Unlimited';
    }
    return `${data} ${unit}`;
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  };

  const getUniqueRegions = () => {
    const regions = [...new Set(packages.map(pkg => pkg.region_slug).filter(Boolean))];
    return regions.map(slug => ({
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/_/g, ' ')
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading eSIM packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Global eSIM Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay connected worldwide with our reliable eSIM packages powered by Airalo
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search.packagesPlaceholder', 'Search packages, countries, or descriptions...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              {t('search.filters', 'Filters')}
            </button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Country Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Countries</option>
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {getCountryFlag(country.code)} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Regions</option>
                      {getUniqueRegions().map(region => (
                        <option key={region.slug} value={region.slug}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="price">Price (Low to High)</option>
                      <option value="data">Data (High to Low)</option>
                      <option value="validity">Validity (Long to Short)</option>
                      <option value="name">Name (A to Z)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => handlePackageSelect(pkg)}
            >
              {/* Package Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {pkg.name}
                  </h3>
                  <span className="text-2xl">
                    {getCountryFlag(pkg.country_code)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {pkg.description}
                </p>
              </div>

              {/* Package Details */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Wifi className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {formatData(pkg.data, pkg.data_unit)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {pkg.validity} {pkg.validity_unit}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {pkg.country_code?.toUpperCase() || 'Global'}
                    </span>
                  </div>
                  {pkg.is_roaming && (
                    <div className="flex items-center text-blue-600">
                      <Globe className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Roaming</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(pkg.price, pkg.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    One-time payment
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {pkg.features?.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredPackages.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No packages found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Results Count */}
        {filteredPackages.length > 0 && (
          <div className="text-center mt-8 text-gray-600">
            Showing {filteredPackages.length} of {packages.length} packages
          </div>
        )}
      </div>
    </div>
  );
};

export default AiraloPlans;
