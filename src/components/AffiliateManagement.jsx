import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    DollarSign,
    TrendingUp,
    Search,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    CreditCard,
    ExternalLink,
    FileText,
    Gift,
    Trash2,
    Link,
    Copy
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

    // Load applications on mount
    React.useEffect(() => {
        loadApplications();
    }, []);

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
            // Don't close modal, let them see the link
            // setShowAppModal(false); 
            // Instead, maybe reload the selected app or just update it in place?
            // Since we reload applications, we can re-find the updated app
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



    const formatDate = (date) => {
        if (!date) return 'N/A';
        // Handle Firestore timestamp
        const d = date.toDate ? date.toDate() : new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Affiliate Management</h2>
                        <p className="text-gray-500">Manage affiliate applications</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Platform</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loadingApps ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center">Loading...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No applications found.</td></tr>
                            ) : (
                                applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{app.fullName}</div>
                                            <div className="text-sm text-gray-500">{app.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center">
                                                View Site <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                            <div className="text-xs text-gray-500 mt-1">{app.trafficSource?.substring(0, 30)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {app.monthlyVisitors}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(app.submittedAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => { setSelectedApp(app); setShowAppModal(true); }}
                                                className="text-gray-600 hover:text-black font-medium text-sm"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Application Details Modal */}
            {
                showAppModal && selectedApp && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                                <button
                                    onClick={() => setShowAppModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
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
                )
            }
        </div >
    );
};

export default AffiliateManagement;
