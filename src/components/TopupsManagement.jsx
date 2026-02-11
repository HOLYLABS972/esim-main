'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import {
  Battery,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Globe,
  MapPin,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Helper: flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  if (countryCode.includes('-') || countryCode.length > 2) return '🌍';
  try {
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  } catch { return '🌍'; }
};

// Helper: categorize topup as global, regional, or country
const categorizeTopup = (topup) => {
  const pType = (topup.package_type || topup.plan_type || '').toLowerCase();
  const slug = (topup.slug || '').toLowerCase();
  const name = (topup.name || '').toLowerCase();

  if (topup.is_global === true || pType === 'global' || slug.startsWith('discover') || name.startsWith('discover')) return 'global';

  const regionalIds = [
    'asia','europe','africa','americas','middle-east','oceania','caribbean',
    'latin-america','north-america','south-america','central-america',
    'eastern-europe','western-europe','scandinavia','asean','gcc','mena',
    'european-union','eu'
  ];
  if (topup.is_regional === true || pType === 'regional' || regionalIds.some(r => slug.includes(r) || name.includes(r))) return 'regional';

  return 'country';
};

const TopupsManagement = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [allTopups, setAllTopups] = useState([]);
  const [filteredTopups, setFilteredTopups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Package type tab (matches PlansManagement)
  const [packageTypeTab, setPackageTypeTab] = useState('countries'); // countries, global, regional

  // Collection filter (Regular / Unlimited / SMS)
  const [showRegularOnly, setShowRegularOnly] = useState(false);
  const [showUnlimitedOnly, setShowUnlimitedOnly] = useState(false);
  const [showSMSOnly, setShowSMSOnly] = useState(false);

  // Hidden filter
  const [showHiddenFilter, setShowHiddenFilter] = useState('visible');

  // Selection
  const [selectedTopups, setSelectedTopups] = useState([]);

  // Price editing
  const [editingPrices, setEditingPrices] = useState({});
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [topupsPerPage] = useState(100);

  // Country flags
  const [countryFlags, setCountryFlags] = useState({});

  // Load country flags
  const loadCountryFlags = async () => {
    try {
      const snap = await getDocs(collection(db, 'countries'));
      const flags = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.code && data.flag) flags[data.code] = data.flag;
      });
      setCountryFlags(flags);
    } catch (e) { console.error('Error loading flags:', e); }
  };

  const getFlagDisplay = (code) => {
    if (countryFlags[code]) return { type: 'image', url: countryFlags[code] };
    return { type: 'emoji', emoji: getFlagEmoji(code) };
  };

  // Load topups from all 3 collections
  const loadAllTopups = useCallback(async () => {
    try {
      setLoading(true);
      const allRaw = [];
      for (const coll of ['topups', 'topups-unlimited', 'topups-sms']) {
        const snap = await getDocs(collection(db, coll));
        snap.docs.forEach(d => allRaw.push({ id: d.id, ...d.data(), _collection: coll }));
      }

      const transformed = allRaw.map(t => {
        const isUnlimited = t._collection === 'topups-unlimited' || t.is_unlimited === true;
        const isSms = t._collection === 'topups-sms' || t.is_sms === true || t.sms_included === true;
        return {
          id: t.id,
          slug: t.slug || t.id,
          name: t.name || t.title || 'Unnamed',
          description: t.description || '',
          price: t.price || t.price_usd || 0,
          original_price: t.original_price || 0,
          capacity: t.capacity || t.data_amount_mb || 0,
          period: t.period || t.validity_days || t.day || 0,
          operator: t.operator || '',
          country_codes: t.country_codes || [],
          country_code: t.country_code || '',
          hidden: t.hidden || false,
          enabled: t.enabled !== false,
          package_type: t.package_type || t.plan_type || t.type || 'country',
          is_global: t.is_global || false,
          is_regional: t.is_regional || false,
          is_unlimited: isUnlimited,
          is_sms: isSms,
          _collection: t._collection,
          _collectionLabel: t._collection === 'topups' ? 'Regular' : t._collection === 'topups-unlimited' ? 'Unlimited' : 'SMS',
        };
      });

      setAllTopups(transformed);
      console.log(`✅ Loaded ${transformed.length} topups`);
    } catch (error) {
      console.error('Error loading topups:', error);
      toast.error('Error loading topups: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (currentUser) { loadAllTopups(); loadCountryFlags(); } }, [currentUser, loadAllTopups]);

  // Filter & search
  useEffect(() => {
    let filtered = [...allTopups];

    // Filter by package type tab (countries / global / regional)
    if (packageTypeTab === 'countries') {
      filtered = filtered.filter(t => categorizeTopup(t) === 'country');
    } else if (packageTypeTab === 'global') {
      filtered = filtered.filter(t => categorizeTopup(t) === 'global');
    } else if (packageTypeTab === 'regional') {
      filtered = filtered.filter(t => categorizeTopup(t) === 'regional');
    }

    // Checkboxes: Regular / Unlimited / SMS
    if (showRegularOnly) {
      filtered = filtered.filter(t => !t.is_unlimited && !t.is_sms);
    }
    if (showUnlimitedOnly) {
      filtered = filtered.filter(t => t.is_unlimited);
    }
    if (showSMSOnly) {
      filtered = filtered.filter(t => t.is_sms);
    }

    // Hidden filter
    if (showHiddenFilter === 'visible') filtered = filtered.filter(t => !t.hidden);
    else if (showHiddenFilter === 'hidden') filtered = filtered.filter(t => t.hidden);

    // Search
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(s) ||
        t.slug?.toLowerCase().includes(s) ||
        t.operator?.toLowerCase().includes(s) ||
        (t.country_codes || []).some(c => c.toLowerCase().includes(s))
      );
    }

    setFilteredTopups(filtered);
    setCurrentPage(1);
  }, [allTopups, packageTypeTab, showRegularOnly, showUnlimitedOnly, showSMSOnly, showHiddenFilter, searchTerm]);

  // Counts for tabs
  const visibleTopups = allTopups.filter(t => !t.hidden);
  const countryCount = visibleTopups.filter(t => categorizeTopup(t) === 'country').length;
  const globalCount = visibleTopups.filter(t => categorizeTopup(t) === 'global').length;
  const regionalCount = visibleTopups.filter(t => categorizeTopup(t) === 'regional').length;

  // Selection
  const toggleSelection = (id) => {
    setSelectedTopups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedTopups(prev => prev.length === filteredTopups.length ? [] : filteredTopups.map(t => t.id));
  };

  // Hide/Unhide batch
  const batchUpdateHidden = async (hidden) => {
    if (selectedTopups.length === 0) { toast.error('Select at least one topup'); return; }
    if (!window.confirm(`${hidden ? 'Hide' : 'Unhide'} ${selectedTopups.length} topup(s)?`)) return;

    try {
      setLoading(true);
      const batch = writeBatch(db);
      let count = 0;

      for (const topupId of selectedTopups) {
        const topup = allTopups.find(t => t.id === topupId);
        if (!topup) continue;
        const ref = doc(db, topup._collection, topupId);
        const snap = await getDoc(ref);
        if (snap.exists()) { batch.update(ref, { hidden }); count++; }
      }

      if (count > 0) {
        await batch.commit();
        toast.success(`${hidden ? 'Hidden' : 'Unhidden'} ${count} topup(s)`);
      }
      setSelectedTopups([]);
      await loadAllTopups();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Price editing
  const startEditingPrice = (id) => setEditingPrices(prev => ({ ...prev, [id]: true }));
  const handlePriceChange = (id, val) => setPendingPriceChanges(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  const cancelPriceChange = (id) => {
    setEditingPrices(prev => { const n = { ...prev }; delete n[id]; return n; });
    setPendingPriceChanges(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const savePriceChange = async (id) => {
    const price = pendingPriceChanges[id];
    if (price === undefined) return;
    try {
      setLoading(true);
      const topup = allTopups.find(t => t.id === id);
      if (!topup) return;
      await updateDoc(doc(db, topup._collection, id), { price });
      toast.success('Price updated to $' + price.toFixed(2));
      cancelPriceChange(id);
      await loadAllTopups();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format capacity
  const formatCapacity = (capacity) => {
    if (capacity === -1 || capacity === 0 || capacity === 'Unlimited' || !capacity) return 'Unlimited';
    const num = typeof capacity === 'string' ? parseFloat(capacity) : Number(capacity);
    if (isNaN(num)) return 'N/A';
    if (num < 1 && num > 0) return `${num.toFixed(2)} GB`;
    if (num >= 1 && num <= 100) return `${num} GB`;
    if (num > 100) {
      const gb = num / 1024;
      return gb < 1 ? `${num} MB` : `${gb.toFixed(2)} GB`;
    }
    return `${num} GB`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredTopups.length / topupsPerPage);
  const startIdx = (currentPage - 1) * topupsPerPage;
  const currentTopups = filteredTopups.slice(startIdx, startIdx + topupsPerPage);

  return (
    <div className="space-y-6">
      {/* Package Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            onClick={() => setPackageTypeTab('countries')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              packageTypeTab === 'countries'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Countries ({countryCount})
          </button>
          <button
            onClick={() => setPackageTypeTab('global')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              packageTypeTab === 'global'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global ({globalCount})
          </button>
          <button
            onClick={() => setPackageTypeTab('regional')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              packageTypeTab === 'regional'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Regional ({regionalCount})
          </button>
        </div>

        {/* Search Bar and Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search topups by name, slug, operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex gap-4 items-center">
              {selectedTopups.length > 0 && (
                showHiddenFilter === 'hidden' ? (
                  <button onClick={() => batchUpdateHidden(false)} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Eye className="w-4 h-4" /> Unhide Selected ({selectedTopups.length})
                  </button>
                ) : (
                  <button onClick={() => batchUpdateHidden(true)} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <EyeOff className="w-4 h-4" /> Hide Selected ({selectedTopups.length})
                  </button>
                )
              )}
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSMSOnly}
                onChange={(e) => setShowSMSOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">SMS Included</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnlimitedOnly}
                onChange={(e) => setShowUnlimitedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">Unlimited Data</span>
            </label>

            {/* Hidden/Visible Filter */}
            <div className="flex gap-2 items-center ml-4 pl-4 border-l border-gray-300">
              <span className="text-sm text-gray-600 font-medium">Status:</span>
              <button onClick={() => setShowHiddenFilter('visible')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showHiddenFilter === 'visible' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>Visible</button>
              <button onClick={() => setShowHiddenFilter('hidden')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showHiddenFilter === 'hidden' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>Hidden</button>
              <button onClick={() => setShowHiddenFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showHiddenFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>All</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Select All */}
        {filteredTopups.length > 0 && (
          <div className="px-6 pt-4 pb-2 border-b border-gray-200">
            <button onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              {selectedTopups.length === filteredTopups.length && filteredTopups.length > 0
                ? <CheckSquare className="w-5 h-5 text-gray-900" />
                : <Square className="w-5 h-5 text-gray-400" />}
              {selectedTopups.length === filteredTopups.length && filteredTopups.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topup</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data & Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTopups.length > 0 ? currentTopups.map(topup => {
                const isSelected = selectedTopups.includes(topup.id);
                const hasMissingPrice = !topup.price || topup.price === 0;
                const category = categorizeTopup(topup);

                return (
                  <tr key={topup.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : hasMissingPrice ? 'bg-red-50' : ''
                    }`}
                    onClick={() => toggleSelection(topup.id)}>

                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap"
                      onClick={e => { e.stopPropagation(); toggleSelection(topup.id); }}>
                      {isSelected
                        ? <CheckSquare className="w-5 h-5 text-blue-600" />
                        : <Square className="w-5 h-5 text-gray-400" />}
                    </td>

                    {/* Name + Operator */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            category === 'global' ? 'bg-purple-100' :
                            category === 'regional' ? 'bg-green-100' :
                            'bg-amber-100'
                          }`}>
                            {category === 'global' ? <Globe className="w-5 h-5 text-purple-600" /> :
                             category === 'regional' ? <MapPin className="w-5 h-5 text-green-600" /> :
                             <Battery className="w-5 h-5 text-amber-600" />}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {topup.name}
                          </div>
                          {topup.operator && (
                            <div className="text-sm text-gray-500">{topup.operator}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {topup.slug}
                      </div>
                    </td>

                    {/* Data & Duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCapacity(topup.capacity)}</div>
                      <div className="text-sm text-gray-500">{topup.period ? `${topup.period} days` : 'N/A'}</div>
                    </td>

                    {/* Countries */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(topup.country_codes || []).length > 0 ? (
                          <>
                            {topup.country_codes.slice(0, 3).map((code, i) => {
                              const flag = getFlagDisplay(code);
                              return (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {flag.type === 'image' ? (
                                    <img src={flag.url} alt={code} className="w-5 h-4 object-cover rounded mr-1"
                                      onError={(e) => { e.target.style.display = 'none'; }} />
                                  ) : (
                                    <span>{flag.emoji}</span>
                                  )}
                                </span>
                              );
                            })}
                            {topup.country_codes.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{topup.country_codes.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">🌍</span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        {editingPrices[topup.id] ? (
                          <>
                            <input type="number" step="0.01" min="0" autoFocus
                              value={pendingPriceChanges[topup.id] !== undefined ? pendingPriceChanges[topup.id] : topup.price}
                              onChange={e => handlePriceChange(topup.id, e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            <button onClick={() => savePriceChange(topup.id)} disabled={loading}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50">Save</button>
                            <button onClick={() => cancelPriceChange(topup.id)}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">Cancel</button>
                          </>
                        ) : (
                          <div onClick={() => startEditingPrice(topup.id)}
                            className={`w-20 px-2 py-1 text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                              hasMissingPrice ? 'text-red-600 font-semibold' : 'text-gray-900'
                            }`}
                            title={hasMissingPrice ? 'Price missing - click to set' : 'Click to edit price'}>
                            {hasMissingPrice ? 'N/A' : `$${typeof topup.price === 'number' ? topup.price.toFixed(2) : topup.price}`}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Battery className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No topups found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredTopups.length > topupsPerPage && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing {startIdx + 1} to {Math.min(startIdx + topupsPerPage, filteredTopups.length)} of {filteredTopups.length} results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  if (!show) {
                    if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2))
                      return <span key={`e-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                    return null;
                  }
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}>{page}</button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopupsManagement;
