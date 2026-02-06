import React, { useState } from 'react';
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    Users,
    DollarSign,
    TrendingUp,
    Search,
    ExternalLink,
    Trash2,
    Link,
    Copy,
    Eye,
    Code,
    ChevronDown,
    ChevronRight,
    Plus
} from 'lucide-react';
import {
    getAffiliateApplications,
    updateAffiliateApplicationStatus,
    approveAffiliateApplication
} from '../services/affiliateService';
import toast from 'react-hot-toast';

const AffiliateManagement = ({
    referralCodes,
    referralUsageStats,
    withdrawalRequests,
    loading,
    onUpdateWithdrawalStatus,
    onNukeData
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Applications State
    const [applications, setApplications] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showAppModal, setShowAppModal] = useState(false);

    // Sales tracking state
    const [sales, setSales] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);

    // Registered affiliates state
    const [affiliates, setAffiliates] = useState([]);
    const [loadingAffiliates, setLoadingAffiliates] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAffiliate, setNewAffiliate] = useState({ name: '', email: '', commission: 10, packageId: '', currency: '', country: '', flag: '' });
    const [selectedAffiliate, setSelectedAffiliate] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [packages, setPackages] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');

    // Expandable rows
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Load all data on mount
    React.useEffect(() => {
        loadApplications();
        loadSales();
        loadAffiliates();
        loadPackages();
    }, []);

    const loadAffiliates = async () => {
        try {
            setLoadingAffiliates(true);
            const snap = await getDocs(query(collection(db, 'affiliates'), orderBy('createdAt', 'desc')));
            const data = [];
            snap.forEach(d => data.push({ id: d.id, ...d.data() }));
            setAffiliates(data);
        } catch (error) {
            console.error('Error loading affiliates:', error);
        } finally {
            setLoadingAffiliates(false);
        }
    };

    const loadPackages = async () => {
        try {
            setLoadingPackages(true);
            const snap = await getDocs(collection(db, 'dataplans'));
            const data = [];
            snap.forEach(d => {
                const plan = d.data();
                if (plan.enabled !== false && plan.hidden !== true) {
                    data.push({ id: d.id, ...plan });
                }
            });
            data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setPackages(data);
        } catch (error) {
            console.error('Error loading packages:', error);
        } finally {
            setLoadingPackages(false);
        }
    };

    const filteredPackages = React.useMemo(() => {
        if (!packageSearch) return packages.slice(0, 50);
        const s = packageSearch.toLowerCase();
        return packages.filter(p =>
            (p.name || '').toLowerCase().includes(s) ||
            (p.id || '').toLowerCase().includes(s) ||
            (p.country_code || '').toLowerCase().includes(s) ||
            (p.country_codes || []).some(c => c.toLowerCase().includes(s))
        ).slice(0, 50);
    }, [packages, packageSearch]);

    const createAffiliate = async () => {
        if (!newAffiliate.name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            const refId = newAffiliate.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
            const affiliateDoc = doc(db, 'affiliates', refId);
            const data = {
                name: newAffiliate.name.trim(),
                email: newAffiliate.email.trim(),
                commission: parseFloat(newAffiliate.commission) || 10,
                refId: refId,
                createdAt: serverTimestamp(),
                active: true
            };
            if (newAffiliate.packageId && newAffiliate.packageId !== '_select') {
                data.packageId = newAffiliate.packageId;
            }
            if (newAffiliate.currency.trim()) {
                data.currency = newAffiliate.currency.trim().toUpperCase();
            }
            if (newAffiliate.country.trim()) {
                data.country = newAffiliate.country.trim().toUpperCase();
            }
            if (newAffiliate.flag.trim()) {
                data.flag = newAffiliate.flag.trim();
            }
            await setDoc(affiliateDoc, data);
            toast.success(`Affiliate "${refId}" created!`);
            setShowCreateModal(false);
            setNewAffiliate({ name: '', email: '', commission: 10, packageId: '', currency: '', country: '', flag: '' });
            setPackageSearch('');
            loadAffiliates();
        } catch (error) {
            console.error('Error creating affiliate:', error);
            toast.error('Failed to create affiliate');
        }
    };

    const deleteAffiliate = async (id) => {
        if (!confirm(`Delete affiliate "${id}"?`)) return;
        try {
            await deleteDoc(doc(db, 'affiliates', id));
            toast.success('Affiliate deleted');
            loadAffiliates();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const deleteApplication = async (id) => {
        if (!confirm(`Delete application "${id}"?`)) return;
        try {
            await deleteDoc(doc(db, 'affiliate_applications', id));
            toast.success('Application deleted');
            loadApplications();
        } catch (error) {
            toast.error('Failed to delete application');
        }
    };

    const loadSales = async () => {
        try {
            setLoadingSales(true);
            const salesQuery = query(collection(db, 'affiliate_sales'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(salesQuery);
            const data = [];
            snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
            setSales(data);
        } catch (error) {
            console.error('Error loading affiliate sales:', error);
        } finally {
            setLoadingSales(false);
        }
    };

    // Group sales by affiliate ref
    const salesByAffiliate = React.useMemo(() => {
        const registeredIds = new Set(affiliates.map(a => a.refId || a.id));
        const grouped = {};
        sales.forEach(sale => {
            const ref = sale.affiliateRef || 'unknown';
            if (!grouped[ref]) {
                grouped[ref] = { sales: [], totalAmount: 0, count: 0, registered: registeredIds.has(ref) };
            }
            grouped[ref].sales.push(sale);
            grouped[ref].totalAmount += parseFloat(sale.amount) || 0;
            grouped[ref].count += 1;
        });
        return grouped;
    }, [sales, affiliates]);

    // Build unified list: registered affiliates + unregistered refs from sales + pending applications
    const unifiedList = React.useMemo(() => {
        const items = [];
        const seenRefs = new Set();

        // 1. Registered affiliates
        affiliates.forEach(a => {
            const refId = a.refId || a.id;
            seenRefs.add(refId);
            const salesData = salesByAffiliate[refId] || { count: 0, totalAmount: 0, sales: [] };
            items.push({
                type: 'registered',
                refId,
                name: a.name,
                email: a.email || '',
                commission: a.commission || 10,
                createdAt: a.createdAt,
                salesCount: salesData.count,
                totalRevenue: salesData.totalAmount,
                salesRecords: salesData.sales || [],
                raw: a
            });
        });

        // 2. Unregistered refs from sales (captured but not created as affiliate)
        Object.entries(salesByAffiliate).forEach(([ref, data]) => {
            if (!seenRefs.has(ref) && ref !== 'unknown') {
                seenRefs.add(ref);
                items.push({
                    type: 'unregistered',
                    refId: ref,
                    name: ref,
                    email: '',
                    commission: '-',
                    createdAt: null,
                    salesCount: data.count,
                    totalRevenue: data.totalAmount,
                    salesRecords: data.sales || [],
                    raw: null
                });
            }
        });

        // 3. All applications (pending, approved, rejected)
        applications.forEach(app => {
            items.push({
                type: 'application',
                refId: app.id,
                name: app.fullName,
                email: app.email,
                commission: '-',
                status: app.status,
                createdAt: app.submittedAt,
                salesCount: 0,
                totalRevenue: 0,
                salesRecords: [],
                raw: app
            });
        });

        return items;
    }, [affiliates, salesByAffiliate, applications]);

    const loadApplications = async () => {
        try {
            setLoadingApps(true);
            const data = await getAffiliateApplications();
            setApplications(data);
        } catch (error) {
            console.error('Error loading applications:', error);
            toast.error('Failed to load affiliate applications');
        } finally {
            setLoadingApps(false);
        }
    };

    const handleApproveApp = async (app) => {
        if (!confirm(`Are you sure you want to approve ${app.fullName}? This will generate their unique affiliate link.`)) return;
        try {
            await approveAffiliateApplication(app);
            toast.success('Application approved and affiliate link generated!');
            loadApplications();
            const updatedApps = await getAffiliateApplications();
            const updatedApp = updatedApps.find(a => a.id === app.id);
            if (updatedApp) setSelectedApp(updatedApp);
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error('Failed to approve application');
        }
    };

    const handleRejectApp = async (app) => {
        if (!confirm(`Are you sure you want to reject ${app.fullName}?`)) return;
        try {
            await updateAffiliateApplicationStatus(app.id, 'rejected');
            toast.success('Application rejected');
            loadApplications();
            setShowAppModal(false);
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error('Failed to reject application');
        }
    };

    const toggleRow = (refId) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(refId)) next.delete(refId);
            else next.add(refId);
            return next;
        });
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = date.toDate ? date.toDate() : new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    };

    // Filter unified list
    const filteredList = unifiedList.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (item.name || '').toLowerCase().includes(s) ||
            (item.email || '').toLowerCase().includes(s) ||
            (item.refId || '').toLowerCase().includes(s);
    });

    const isLoading = loadingAffiliates || loadingSales || loadingApps;

    return (
        <div className="space-y-6">
            {/* Header + Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Affiliate Management</h2>
                        <p className="text-gray-500">Track affiliates, applications & sales in one place</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-3 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Affiliate
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-xs text-gray-500">Total Revenue</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ${sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-gray-500">Total Sales</p>
                                <p className="text-lg font-bold text-gray-900">{sales.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-xs text-gray-500">Affiliates</p>
                                <p className="text-lg font-bold text-gray-900">{affiliates.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-xs text-gray-500">Applications</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {applications.length}
                                    {applications.filter(a => a.status === 'pending').length > 0 && (
                                        <span className="text-xs font-normal text-yellow-600 ml-1">
                                            ({applications.filter(a => a.status === 'pending').length} pending)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email or ref ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Unified Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase w-8"></th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ref ID</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Commission</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sales</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredList.length === 0 ? (
                                <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                    {unifiedList.length === 0 ? 'No affiliates yet. Create one to get started.' : 'No results match your search.'}
                                </td></tr>
                            ) : (
                                filteredList.map((item) => {
                                    const isExpanded = expandedRows.has(item.refId);
                                    const hasSales = item.salesRecords.length > 0;
                                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                                    const currencyParam = item.raw?.currency ? `&currency=${item.raw.currency}` : '';
                                    const countryParam = item.raw?.country ? `&country=${item.raw.country}` : '';
                                    const flagParam = item.raw?.flag ? `&flag=${encodeURIComponent(item.raw.flag)}` : '';
                                    const shareLink = item.raw?.packageId
                                        ? `${origin}/share-package/${item.raw.packageId}?ref=${item.refId}${currencyParam}${countryParam}${flagParam}`
                                        : `${origin}/?ref=${item.refId}${currencyParam}${countryParam}${flagParam}`;

                                    return (
                                        <React.Fragment key={`${item.type}-${item.refId}`}>
                                            <tr className={`hover:bg-gray-50 ${isExpanded ? 'bg-blue-50' : ''}`}>
                                                {/* Expand toggle */}
                                                <td className="px-4 py-3">
                                                    {hasSales ? (
                                                        <button onClick={() => toggleRow(item.refId)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                        </button>
                                                    ) : (
                                                        <span className="w-4 h-4 block" />
                                                    )}
                                                </td>
                                                {/* Ref ID */}
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.refId}</span>
                                                </td>
                                                {/* Name */}
                                                <td className="px-4 py-3 font-medium text-gray-900 text-sm">{item.name}</td>
                                                {/* Email */}
                                                <td className="px-4 py-3 text-sm text-gray-500">{item.email || '-'}</td>
                                                {/* Type badge */}
                                                <td className="px-4 py-3">
                                                    {item.type === 'registered' && (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Affiliate</span>
                                                    )}
                                                    {item.type === 'unregistered' && (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">Unregistered</span>
                                                    )}
                                                    {item.type === 'application' && item.status === 'pending' && (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending App</span>
                                                    )}
                                                    {item.type === 'application' && item.status === 'approved' && (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved App</span>
                                                    )}
                                                    {item.type === 'application' && item.status === 'rejected' && (
                                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected App</span>
                                                    )}
                                                </td>
                                                {/* Commission */}
                                                <td className="px-4 py-3 text-sm">
                                                    {item.commission !== '-' ? (
                                                        <span className="font-medium text-green-600">{item.commission}%</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                {/* Sales */}
                                                <td className="px-4 py-3">
                                                    {item.salesCount > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                                                            {item.salesCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">0</span>
                                                    )}
                                                </td>
                                                {/* Revenue */}
                                                <td className="px-4 py-3 text-sm font-bold text-green-600">
                                                    {item.totalRevenue > 0 ? `$${item.totalRevenue.toFixed(2)}` : <span className="text-gray-400 font-normal">$0.00</span>}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        {item.type === 'registered' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        const salesData = salesByAffiliate[item.refId] || { count: 0, totalAmount: 0 };
                                                                        setSelectedAffiliate({ ...item.raw, refId: item.refId, salesData });
                                                                        setShowDetailsModal(true);
                                                                    }}
                                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="View details (AppsFlyer + Iframe)"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(shareLink);
                                                                        toast.success('Affiliate link copied!');
                                                                    }}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Copy affiliate link"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteAffiliate(item.raw.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete affiliate"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {item.type === 'unregistered' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(shareLink);
                                                                        toast.success('Link copied!');
                                                                    }}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Copy link"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {item.type === 'application' && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setSelectedApp(item.raw); setShowAppModal(true); }}
                                                                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                                        item.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                                >
                                                                    {item.status === 'pending' ? 'Review' : 'Details'}
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteApplication(item.raw.id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete application"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Expanded sales records */}
                                            {isExpanded && hasSales && (
                                                <tr>
                                                    <td colSpan="9" className="bg-gray-50 px-0 py-0">
                                                        <div className="px-12 py-3">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sales Records</p>
                                                            <div className="space-y-1">
                                                                {item.salesRecords.map(sale => (
                                                                    <div key={sale.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2 border border-gray-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="font-medium text-gray-900">{sale.planName || sale.planId}</span>
                                                                            {sale.countryName && <span className="text-gray-400">({sale.countryName})</span>}
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-xs text-gray-500">{sale.customerEmail}</span>
                                                                            <span className="font-bold text-green-600">${parseFloat(sale.amount || 0).toFixed(2)}</span>
                                                                            <span className="text-xs text-gray-400">{formatDate(sale.createdAt)}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Affiliate Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Create Affiliate</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">&#x2715;</button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={newAffiliate.name}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. John Smith"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {newAffiliate.name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ref ID: <span className="font-mono">{newAffiliate.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newAffiliate.email}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="affiliate@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                                <input
                                    type="number"
                                    value={newAffiliate.commission}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, commission: e.target.value }))}
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency (optional)</label>
                                <input
                                    type="text"
                                    value={newAffiliate.currency}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. EUR, GBP, AUD"
                                    maxLength={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                                <p className="text-xs text-gray-500 mt-1">Display currency passed in the link. Does not change Stripe price.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country (optional)</label>
                                <input
                                    type="text"
                                    value={newAffiliate.country}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                                    placeholder="e.g. AU, US, GB"
                                    maxLength={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                />
                                <p className="text-xs text-gray-500 mt-1">Country code passed as &country= in the link.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Flag (optional)</label>
                                <input
                                    type="text"
                                    value={newAffiliate.flag}
                                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, flag: e.target.value }))}
                                    placeholder="e.g. 🇦🇺"
                                    maxLength={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Flag emoji passed as &flag= in the link.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Link</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => { setNewAffiliate(prev => ({ ...prev, packageId: '' })); setPackageSearch(''); }}
                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                            !newAffiliate.packageId
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        General Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewAffiliate(prev => ({ ...prev, packageId: '_select' }))}
                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                            newAffiliate.packageId
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Specific Package
                                    </button>
                                </div>
                                {newAffiliate.packageId && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={packageSearch}
                                            onChange={(e) => setPackageSearch(e.target.value)}
                                            placeholder="Search packages by name, ID or country..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                                            {loadingPackages ? (
                                                <p className="px-3 py-2 text-sm text-gray-500">Loading packages...</p>
                                            ) : filteredPackages.length === 0 ? (
                                                <p className="px-3 py-2 text-sm text-gray-500">No packages found</p>
                                            ) : (
                                                filteredPackages.map(pkg => (
                                                    <button
                                                        key={pkg.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const cc = (pkg.country_code || '').toUpperCase();
                                                            const flag = cc.length === 2
                                                                ? String.fromCodePoint(...[...cc].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
                                                                : '';
                                                            setNewAffiliate(prev => ({
                                                                ...prev,
                                                                packageId: pkg.id,
                                                                country: prev.country || cc,
                                                                flag: prev.flag || flag
                                                            }));
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 hover:bg-blue-50 transition-colors ${
                                                            newAffiliate.packageId === pkg.id ? 'bg-blue-50 font-medium text-blue-700' : ''
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="truncate">{pkg.name || pkg.id}</span>
                                                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                                                {pkg.country_code || (pkg.country_codes || []).join(', ')} · ${pkg.price}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                        {newAffiliate.packageId && newAffiliate.packageId !== '_select' && (
                                            <p className="text-xs text-green-600">
                                                Selected: <span className="font-mono font-medium">{newAffiliate.packageId}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {newAffiliate.packageId ? 'Link will point to a specific package page' : 'Link will point to the general share page'}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createAffiliate}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Affiliate Details Modal (AppsFlyer + Iframe) */}
            {showDetailsModal && selectedAffiliate && (() => {
                const refId = selectedAffiliate.refId;
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
                const currencyParam = selectedAffiliate.currency ? `&currency=${selectedAffiliate.currency}` : '';
                const countryParam = selectedAffiliate.country ? `&country=${selectedAffiliate.country}` : '';
                const flagParam = selectedAffiliate.flag ? `&flag=${encodeURIComponent(selectedAffiliate.flag)}` : '';
                const affiliateLink = selectedAffiliate.packageId
                    ? `${origin}/share-package/${selectedAffiliate.packageId}?ref=${refId}${currencyParam}${countryParam}${flagParam}`
                    : `${origin}/?ref=${refId}${currencyParam}${countryParam}${flagParam}`;
                const appsFlyerLink = `https://app.appsflyer.com/redirect?pid=affiliate&c=${refId}&af_dp=${encodeURIComponent(affiliateLink)}&af_web_dp=${encodeURIComponent(affiliateLink)}`;
                const iframeCode = `<iframe\n  src="${affiliateLink}"\n  width="100%"\n  height="700"\n  style="border: none; border-radius: 12px; max-width: 480px;"\n  allow="payment"\n  title="eSIM Purchase - ${selectedAffiliate.name}"\n></iframe>`;
                const salesData = selectedAffiliate.salesData || { count: 0, totalAmount: 0 };

                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedAffiliate.name}</h3>
                                    <p className="text-sm text-gray-500">Ref ID: <span className="font-mono">{refId}</span></p>
                                </div>
                                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">&#x2715;</button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Affiliate Info */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Commission</p>
                                        <p className="text-lg font-bold text-green-600">{selectedAffiliate.commission || 10}%</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Sales</p>
                                        <p className="text-lg font-bold text-blue-600">{salesData.count}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-gray-500">Revenue</p>
                                        <p className="text-lg font-bold text-green-600">${salesData.totalAmount.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Direct Affiliate Link */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Link className="w-4 h-4 text-blue-600" />
                                        Direct Affiliate Link
                                    </h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-xs text-blue-900 font-mono break-all flex-1">{affiliateLink}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(affiliateLink);
                                                    toast.success('Direct link copied!');
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2">Share this link directly. The <code className="bg-blue-100 px-1 rounded">?ref={refId}</code> parameter tracks all sales.</p>
                                    </div>
                                </div>

                                {/* AppsFlyer Link */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-purple-600" />
                                        AppsFlyer Tracking Link
                                    </h4>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-xs text-purple-900 font-mono break-all flex-1">{appsFlyerLink}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(appsFlyerLink);
                                                    toast.success('AppsFlyer link copied!');
                                                }}
                                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-purple-600 mt-2">Use this link with AppsFlyer for advanced attribution tracking. Parameters: <code className="bg-purple-100 px-1 rounded">pid=affiliate</code>, <code className="bg-purple-100 px-1 rounded">c={refId}</code></p>
                                    </div>
                                </div>

                                {/* Iframe Embed Code */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Code className="w-4 h-4 text-gray-600" />
                                        Iframe Embed Code
                                    </h4>
                                    <div className="bg-gray-900 rounded-lg p-4 relative">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(iframeCode);
                                                toast.success('Iframe code copied!');
                                            }}
                                            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-x-auto">{iframeCode}</pre>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Paste this code into any HTML page to embed the purchase widget with affiliate tracking.</p>
                                </div>

                                {/* Iframe Preview */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-gray-600" />
                                        Iframe Preview
                                    </h4>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                                        <div className="mx-auto" style={{ maxWidth: '480px' }}>
                                            <iframe
                                                src={affiliateLink}
                                                width="100%"
                                                height="500"
                                                style={{ border: 'none', borderRadius: '8px' }}
                                                title={`Preview - ${selectedAffiliate.name}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Application Details Modal */}
            {showAppModal && selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                            <button onClick={() => setShowAppModal(false)} className="text-gray-400 hover:text-gray-600">&#x2715;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Applicant</h4>
                                    <p className="text-lg font-semibold">{selectedApp.fullName}</p>
                                    <p className="text-gray-600">{selectedApp.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedApp.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        selectedApp.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedApp.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Platform & Traffic</h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Website:</span>
                                        <a href={selectedApp.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {selectedApp.website}
                                        </a>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Visitors:</span>
                                        <span className="font-medium">{selectedApp.monthlyVisitors}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 block mb-1">Traffic Source:</span>
                                        <p className="text-gray-900 text-sm whitespace-pre-wrap">{selectedApp.trafficSource}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Experience & Motivation</h4>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-gray-600 text-sm block">Experience Level:</span>
                                        <p className="font-medium capitalize">{selectedApp.experience}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm block">Why Join:</span>
                                        <p className="font-medium capitalize">{selectedApp.whyJoin?.replace('-', ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm block">Motivation:</span>
                                        <p className="font-medium capitalize">{selectedApp.motivation?.replace('-', ' ')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Affiliate Link Section - Show if approved */}
                            {selectedApp.status === 'approved' && selectedApp.affiliateLink && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Affiliate Link</h4>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                <code className="text-sm text-blue-900 truncate font-mono">
                                                    {selectedApp.affiliateLink}
                                                </code>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedApp.affiliateLink);
                                                    toast.success('Link copied to clipboard!');
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="Copy Link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2">
                                            Share this link with the affiliate. It includes their unique tracking parameter.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedApp.status === 'pending' && (
                                <div className="border-t border-gray-200 pt-6 flex space-x-3">
                                    <button
                                        onClick={() => handleApproveApp(selectedApp)}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                                    >
                                        Approve Application
                                    </button>
                                    <button
                                        onClick={() => handleRejectApp(selectedApp)}
                                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 font-medium transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AffiliateManagement;
