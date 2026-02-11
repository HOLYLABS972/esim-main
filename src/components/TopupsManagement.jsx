'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  if (countryCode.includes('-') || countryCode.length > 2) return '🌍';
  try {
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  } catch { return '🌍'; }
};

const TopupsManagement = () => {
  const [allTopups, setAllTopups] = useState([]);
  const [filteredTopups, setFilteredTopups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('all'); // all, regular, unlimited, sms
  const [showHiddenFilter, setShowHiddenFilter] = useState('visible'); // visible, hidden, all
  const [selectedTopups, setSelectedTopups] = useState([]);
  const [editingPrices, setEditingPrices] = useState({});
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const topupsPerPage = 50;

  // Stats
  const [stats, setStats] = useState({ regular: 0, unlimited: 0, sms: 0, total: 0 });

  const loadAllTopups = useCallback(async () => {
    try {
      setLoading(true);
      const allRaw = [];

      for (const coll of ['topups', 'topups-unlimited', 'topups-sms']) {
        const snap = await getDocs(collection(db, coll));
        snap.docs.forEach(d => allRaw.push({ id: d.id, ...d.data(), _collection: coll }));
      }

      // Transform
      const transformed = allRaw.map(t => ({
        id: t.id,
        slug: t.slug || t.id,
        name: t.name || t.title || 'Unnamed',
        description: t.description || '',
        price: t.price || t.price_usd || 0,
        capacity: t.capacity || t.data_amount_mb || 0,
        period: t.period || t.validity_days || 0,
        operator: t.operator || '',
        country_codes: t.country_codes || [],
        country_id: t.country_id || '',
        hidden: t.hidden || false,
        enabled: t.enabled !== false,
        package_type: t.package_type || t.type || 'country',
        _collection: t._collection,
        _collectionLabel: t._collection === 'topups' ? 'Regular' : t._collection === 'topups-unlimited' ? 'Unlimited' : 'SMS',
        raw: t
      }));

      setAllTopups(transformed);

      const regular = transformed.filter(t => t._collection === 'topups').length;
      const unlimited = transformed.filter(t => t._collection === 'topups-unlimited').length;
      const sms = transformed.filter(t => t._collection === 'topups-sms').length;
      setStats({ regular, unlimited, sms, total: transformed.length });

      console.log(`✅ Loaded ${transformed.length} topups (${regular} regular, ${unlimited} unlimited, ${sms} SMS)`);
    } catch (error) {
      console.error('❌ Error loading topups:', error);
      toast.error('Error loading topups: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAllTopups(); }, [loadAllTopups]);

  // Filter & search
  useEffect(() => {
    let filtered = [...allTopups];

    // Collection filter
    if (collectionFilter === 'regular') filtered = filtered.filter(t => t._collection === 'topups');
    else if (collectionFilter === 'unlimited') filtered = filtered.filter(t => t._collection === 'topups-unlimited');
    else if (collectionFilter === 'sms') filtered = filtered.filter(t => t._collection === 'topups-sms');

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
  }, [allTopups, collectionFilter, showHiddenFilter, searchTerm]);

  // Selection
  const toggleSelection = (id) => {
    setSelectedTopups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedTopups(prev => prev.length === filteredTopups.length ? [] : filteredTopups.map(t => t.id));
  };

  // Hide/Unhide
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
    if (num > 100) { const gb = num / 1024; return gb < 1 ? `${num} MB` : `${gb.toFixed(1)} GB`; }
    return `${num} GB`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredTopups.length / topupsPerPage);
  const startIdx = (currentPage - 1) * topupsPerPage;
  const currentTopups = filteredTopups.slice(startIdx, startIdx + topupsPerPage);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'Regular', value: stats.regular, color: 'green' },
          { label: 'Unlimited', value: stats.unlimited, color: 'purple' },
          { label: 'SMS', value: stats.sms, color: 'orange' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Collection tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          {[
            { id: 'all', label: `All (${stats.total})` },
            { id: 'regular', label: `Regular (${stats.regular})` },
            { id: 'unlimited', label: `Unlimited (${stats.unlimited})` },
            { id: 'sms', label: `SMS (${stats.sms})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCollectionFilter(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                collectionFilter === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
          <div className="flex gap-2 items-center">
            {selectedTopups.length > 0 && (
              showHiddenFilter === 'hidden' ? (
                <button onClick={() => batchUpdateHidden(false)} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                  <Eye className="w-4 h-4" /> Unhide ({selectedTopups.length})
                </button>
              ) : (
                <button onClick={() => batchUpdateHidden(true)} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  <EyeOff className="w-4 h-4" /> Hide ({selectedTopups.length})
                </button>
              )
            )}
            <button onClick={loadAllTopups} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 items-center mt-4">
          <span className="text-sm text-gray-600 font-medium">Status:</span>
          {['visible', 'hidden', 'all'].map(f => (
            <button key={f} onClick={() => setShowHiddenFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showHiddenFilter === f
                  ? (f === 'visible' ? 'bg-green-500 text-white' : f === 'hidden' ? 'bg-gray-500 text-white' : 'bg-blue-500 text-white')
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data & Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTopups.length > 0 ? currentTopups.map(topup => {
                const isSelected = selectedTopups.includes(topup.id);
                return (
                  <tr key={topup.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => toggleSelection(topup.id)}>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => { e.stopPropagation(); toggleSelection(topup.id); }}>
                      {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Battery className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{topup.name}</div>
                          {topup.operator && <div className="text-sm text-gray-500">{topup.operator}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">{topup.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        topup._collection === 'topups' ? 'bg-green-100 text-green-800' :
                        topup._collection === 'topups-unlimited' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {topup._collectionLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCapacity(topup.capacity)}</div>
                      <div className="text-sm text-gray-500">{topup.period ? `${topup.period} days` : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(topup.country_codes || []).length > 0 ? (
                          <>
                            {topup.country_codes.slice(0, 3).map((code, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getFlagEmoji(code)} {code}
                              </span>
                            ))}
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
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        {editingPrices[topup.id] ? (
                          <>
                            <input type="number" step="0.01" min="0" autoFocus
                              value={pendingPriceChanges[topup.id] !== undefined ? pendingPriceChanges[topup.id] : topup.price}
                              onChange={e => handlePriceChange(topup.id, e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => savePriceChange(topup.id)} disabled={loading}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50">Save</button>
                            <button onClick={() => cancelPriceChange(topup.id)}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">Cancel</button>
                          </>
                        ) : (
                          <div onClick={() => startEditingPrice(topup.id)}
                            className={`w-20 px-2 py-1 text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                              !topup.price ? 'text-red-600 font-semibold' : 'text-gray-900'
                            }`}>
                            {!topup.price ? 'N/A' : `$${typeof topup.price === 'number' ? topup.price.toFixed(2) : topup.price}`}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <Battery className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No topups found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
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
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Showing {startIdx + 1} to {Math.min(startIdx + topupsPerPage, filteredTopups.length)} of {filteredTopups.length}
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                if (!show) {
                  if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2))
                    return <span key={`e-${page}`} className="px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">...</span>;
                  return null;
                }
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}>{page}</button>
                );
              })}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopupsManagement;
