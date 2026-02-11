'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode, Copy, Share2, Smartphone, ArrowLeft, Check, Camera,
  Settings, CheckCircle, Globe, Battery, BarChart3, Loader2,
  Wifi, Clock, Shield, ChevronDown, ChevronUp, Radio, AlertCircle, Zap
} from 'lucide-react';
import LPAQRCodeDisplay from './dashboard/LPAQRCodeDisplay';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const QRCodePage = ({ orderId, iccid }) => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLPA, setCopiedLPA] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('ios');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (iccid && iccid !== 'undefined' && iccid !== 'null') {
      fetchQRCodeByIccid();
    } else if (orderId && orderId !== 'undefined' && orderId !== 'null') {
      fetchQRCode();
    } else {
      setError('No ICCID or Order ID provided');
      setLoading(false);
    }
  }, [orderId, iccid, currentUser, authLoading]);

  // --- Data Fetching (unchanged logic, cleaned up) ---
  const normalizeIccid = (v) => v ? String(v).trim() : null;

  const extractIccidFromOrder = (d) => {
    const checks = [
      d?.iccid, d?.qrCode?.iccid, d?.orderResult?.iccid, d?.esimData?.iccid,
      d?.airaloOrderData?.sims?.[0]?.iccid, d?.orderData?.sims?.[0]?.iccid,
      d?.sims?.[0]?.iccid, d?.airaloOrderData?.iccid, d?.orderResult?.sims?.[0]?.iccid,
    ];
    return normalizeIccid(checks.find(v => v != null));
  };

  const fetchQRCodeByIccid = async () => {
    try {
      setLoading(true);
      setError(null);
      const normalizedSearch = normalizeIccid(iccid);
      let orderData = null, foundId = null;

      if (currentUser) {
        try {
          const snap = await getDocs(collection(db, 'users', currentUser.uid, 'esims'));
          for (const d of snap.docs) {
            if (extractIccidFromOrder(d.data()) === normalizedSearch) {
              orderData = d.data(); foundId = d.id; break;
            }
          }
        } catch (e) { /* ignore */ }
      }

      if (!orderData) {
        try {
          const snap = await getDocs(collection(db, 'orders'));
          for (const d of snap.docs) {
            if (extractIccidFromOrder(d.data()) === normalizedSearch) {
              orderData = d.data(); foundId = d.id; break;
            }
          }
        } catch (e) { /* ignore */ }
      }

      if (!orderData) {
        setError(`Order not found for ICCID: ${iccid}`);
        setLoading(false);
        return;
      }
      extractQRCodeData(orderData, foundId);
    } catch (err) {
      setError(err.message || 'Failed to load order data');
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      let orderData = null;

      if (currentUser) {
        try {
          const d = await getDoc(doc(db, 'users', currentUser.uid, 'esims', orderId));
          if (d.exists()) orderData = d.data();
        } catch (e) { /* ignore */ }
      }
      if (!orderData) {
        try {
          const d = await getDoc(doc(db, 'orders', orderId));
          if (d.exists()) orderData = d.data();
        } catch (e) { /* ignore */ }
      }

      if (!orderData) { setError('Order not found'); setLoading(false); return; }
      extractQRCodeData(orderData, orderId);
    } catch (err) {
      setError(err.message || 'Failed to load order data');
      setLoading(false);
    }
  };

  const extractQRCodeData = (orderData, foundOrderId) => {
    let qrCodeData = null;
    const sources = [
      orderData.airaloOrderData?.sims?.[0],
      orderData.esimData,
      orderData.orderData?.sims?.[0],
      orderData,
      orderData.sims?.[0],
    ];

    for (const s of sources) {
      if (!s) continue;
      const qr = s.qrcode || s.qrCode || s.lpa;
      if (qr) {
        qrCodeData = {
          qrCode: qr,
          qrCodeUrl: s.qrcode_url || s.qrCodeUrl || '',
          lpa: s.lpa || qr,
          iccid: s.iccid || '',
          activationCode: s.activation_code || s.activationCode || '',
          matchingId: s.matching_id || s.matchingId || '',
          directAppleInstallationUrl: s.direct_apple_installation_url || '',
        };
        break;
      }
    }

    if (qrCodeData?.qrCode) {
      setQrData(qrCodeData);
      const cc = orderData.countryCode || orderData.airaloOrderData?.country_code ||
                 orderData.orderResult?.country_code || orderData.country_code;
      setOrderInfo({
        orderId: foundOrderId,
        planName: orderData.package_id || orderData.packageId || orderData.packageName || orderData.airaloOrderData?.package || 'eSIM Plan',
        amount: orderData.price || orderData.amount || orderData.airaloOrderData?.price || 0,
        countryCode: cc
      });
    } else {
      setError('QR code not available for this order.');
    }
    setLoading(false);
  };

  // --- Actions ---
  const copyLPA = () => {
    if (!qrData?.lpa) return;
    navigator.clipboard.writeText(qrData.lpa).then(() => {
      setCopiedLPA(true);
      toast.success('Activation code copied!');
      setTimeout(() => setCopiedLPA(false), 3000);
    });
  };

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'eSIM Installation - RoamJet', text: 'Install your eSIM', url }); }
      catch { copyPageLink(); }
    } else { copyPageLink(); }
  };

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleTopup = () => {
    if (!qrData?.iccid) { toast.error('No ICCID found'); return; }
    const cc = orderInfo?.countryCode;
    router.push(cc ? `/topup/${qrData.iccid}?country=${encodeURIComponent(cc)}` : `/topup/${qrData.iccid}`);
  };

  const handleDataUsage = () => {
    if (!qrData?.iccid) { toast.error('No ICCID available'); return; }
    const q = orderId ? `?orderId=${orderId}` : '';
    router.push(`/data-usage/${qrData.iccid}${q}`);
  };

  const toggleStep = (step) => {
    setCompletedSteps(prev => prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]);
  };

  // --- Loading / Error States ---
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tufts-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your eSIM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 text-sm">{error}</p>
          <button onClick={() => iccid ? fetchQRCodeByIccid() : fetchQRCode()}
            className="w-full px-4 py-3 bg-tufts-blue text-white rounded-xl font-medium hover:bg-tufts-blue-dark transition-colors">
            Try Again
          </button>
          <button onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-3 mt-3 text-gray-600 hover:text-gray-900 transition-colors text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- iOS Steps ---
  const iosSteps = [
    { icon: Camera, title: 'Open Camera', desc: 'Open the Camera app on your iPhone' },
    { icon: QrCode, title: 'Scan QR Code', desc: 'Point your camera at the QR code above' },
    { icon: Smartphone, title: 'Tap Notification', desc: 'Tap "Cellular Plan Detected" when it appears' },
    { icon: Settings, title: 'Add eSIM', desc: 'Follow the prompts to add and label your eSIM' },
    { icon: Globe, title: 'Enable Roaming', desc: 'Settings → Cellular → Your eSIM → Data Roaming ON' },
  ];

  // --- Android Steps ---
  const androidSteps = [
    { icon: Settings, title: 'Open Settings', desc: 'Go to Settings → Network & Internet → SIMs → Add eSIM' },
    { icon: QrCode, title: 'Scan QR Code', desc: 'Select "Use QR code" and scan the code above' },
    { icon: CheckCircle, title: 'Confirm', desc: 'Review the details and tap "Add" to install' },
    { icon: Globe, title: 'Enable Roaming', desc: 'Settings → Network → Your eSIM → Data Roaming ON' },
  ];

  const steps = selectedDevice === 'ios' ? iosSteps : androidSteps;
  const totalSteps = steps.length;
  const progress = completedSteps.length / totalSteps;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Install eSIM</h1>
          <button onClick={shareLink}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Plan Info Card */}
        {orderInfo && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Your Plan</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{orderInfo.planName}</p>
              </div>
              {orderInfo.countryCode && (
                <div className="text-3xl">
                  {(() => {
                    try {
                      const cc = orderInfo.countryCode.toUpperCase();
                      return String.fromCodePoint(...cc.split('').map(c => 127397 + c.charCodeAt()));
                    } catch { return '🌍'; }
                  })()}
                </div>
              )}
            </div>
            {qrData?.iccid && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-mono">ICCID: {qrData.iccid}</p>
              </div>
            )}
          </div>
        )}

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 pb-4">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-500">Scan with your phone camera</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="w-64 h-64 sm:w-72 sm:h-72 p-4 bg-white rounded-2xl border-2 border-gray-100">
                {qrData?.qrCode ? (
                  <LPAQRCodeDisplay lpaData={qrData.qrCode} />
                ) : qrData?.qrCodeUrl ? (
                  <img src={qrData.qrCodeUrl} alt="eSIM QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Install Buttons */}
            <div className="mt-4 space-y-2">
              {qrData?.directAppleInstallationUrl && (
                <a href={qrData.directAppleInstallationUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors">
                  <Zap className="w-5 h-5" />
                  Install on iPhone
                </a>
              )}
              {!qrData?.directAppleInstallationUrl && (
                <button onClick={() => {
                  if (qrData?.lpa) {
                    navigator.clipboard.writeText(qrData.lpa).then(() => {
                      toast.success('Activation code copied! Go to Settings → Cellular → Add eSIM → Enter Manually');
                    });
                  }
                }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-tufts-blue text-white rounded-xl font-medium hover:bg-tufts-blue-dark transition-colors">
                  <Smartphone className="w-5 h-5" />
                  Install eSIM
                </button>
              )}
            </div>
          </div>

          {/* Manual Install Toggle */}
          <div className="border-t border-gray-100">
            <button onClick={() => setShowManualInstall(!showManualInstall)}
              className="w-full px-6 py-3.5 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Can't scan? Install manually
              </span>
              {showManualInstall ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showManualInstall && qrData?.lpa && (
              <div className="px-6 pb-5 space-y-3">
                <p className="text-xs text-gray-500">Copy this activation code and enter it manually in your phone's eSIM settings:</p>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <code className="flex-1 text-xs text-gray-700 break-all font-mono leading-relaxed">{qrData.lpa}</code>
                  <button onClick={copyLPA}
                    className="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    {copiedLPA ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {qrData?.iccid && (
            <>
              <button onClick={handleDataUsage}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-tufts-blue/30 hover:bg-tufts-blue/5 transition-all active:scale-[0.98]">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-tufts-blue" />
                </div>
                <span className="text-sm font-medium text-gray-700">Data Usage</span>
              </button>
              <button onClick={handleTopup}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-green-300 hover:bg-green-50/50 transition-all active:scale-[0.98]">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <Battery className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Data</span>
              </button>
            </>
          )}
        </div>

        {/* Installation Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button onClick={() => setShowInstructions(!showInstructions)}
            className="w-full px-5 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">How to Install</h3>
            {showInstructions ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showInstructions && (
            <div className="px-5 pb-5">
              {/* Device Selector */}
              <div className="flex gap-2 bg-gray-100 rounded-xl p-1 mb-5">
                <button onClick={() => { setSelectedDevice('ios'); setCompletedSteps([]); }}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedDevice === 'ios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}>
                  <Smartphone className="w-4 h-4" /> iPhone
                </button>
                <button onClick={() => { setSelectedDevice('android'); setCompletedSteps([]); }}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedDevice === 'android' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}>
                  <Radio className="w-4 h-4" /> Android
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const done = completedSteps.includes(stepNum);
                  const Icon = step.icon;
                  return (
                    <button key={stepNum} onClick={() => toggleStep(stepNum)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                        done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        done ? 'bg-green-500 text-white' : 'bg-tufts-blue text-white'
                      }`}>
                        {done ? <Check className="w-4 h-4" /> : stepNum}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Progress */}
              {completedSteps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Progress</span>
                    <span className="text-xs text-gray-500">{completedSteps.length}/{totalSteps}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips Card */}
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <h4 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Important Tips
          </h4>
          <ul className="space-y-2 text-xs text-amber-800">
            <li className="flex items-start gap-2">
              <Wifi className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Make sure you're connected to Wi-Fi during installation</span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Your device must support eSIM (most phones from 2019+)</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Install before your trip — activate data roaming when you arrive</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Each QR code can only be used once — don't delete the eSIM after installing</span>
            </li>
          </ul>
        </div>

        {/* Bottom Spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default QRCodePage;
