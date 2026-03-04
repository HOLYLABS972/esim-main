'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, QrCode } from 'lucide-react';

/**
 * PaymentSuccess — Display-only page.
 * All business logic (Airalo provisioning, DB writes) handled by webhooks.
 * This page just polls the order status and shows the QR code when ready.
 */
const PaymentSuccess = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing | ready | error | timeout
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const pollCount = useRef(0);
  const maxPolls = 30; // 30 × 2s = 60s max wait
  const hasStarted = useRef(false);

  // Get transaction/order info from URL params
  const transactionId = searchParams.get('_ptxn') || searchParams.get('transaction_id');
  const orderId = searchParams.get('order_id') || searchParams.get('order');
  const isCancel = searchParams.get('cancel') === 'true';

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    if (isCancel) {
      setStatus('error');
      setError('Payment was cancelled.');
      return;
    }

    if (transactionId) {
      pollPaddleOrder(transactionId);
    } else if (orderId) {
      pollOrderById(orderId);
    } else {
      setStatus('error');
      setError('No transaction or order ID found.');
    }
  }, []);

  // Get orderId from Paddle transaction, then poll Supabase
  async function pollPaddleOrder(txnId) {
    try {
      // Try to get orderId from Paddle (may take a few attempts)
      let oid = null;
      let customerEmail = null;
      let planName = null;

      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/paddle/transaction?txn=${encodeURIComponent(txnId)}`);
          if (res.ok) {
            const data = await res.json();
            oid = data.customData?.orderId;
            customerEmail = data.customData?.customerEmail;
            planName = data.customData?.planName;
            if (oid) break;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 2000));
      }

      if (oid) {
        // Got orderId — now poll Supabase for the fulfilled order (webhook fills it)
        pollCount.current = 0;
        pollOrderById(oid);
      } else {
        // Could not get orderId from Paddle — show "almost there" (webhook will handle)
        setStatus('timeout');
        setOrder({ customer_email: customerEmail, plan_name: planName });
      }
    } catch (e) {
      console.error('Paddle poll error:', e);
      // Never show error for paid transactions — webhook will deliver
      setStatus('timeout');
    }
  }

  // Poll Supabase for order with QR code (webhook fills this in)
  async function pollOrderById(oid) {
    try {
      const res = await fetch(`/api/orders/status?id=${encodeURIComponent(oid)}`);
      if (!res.ok) {
        if (pollCount.current < maxPolls) {
          pollCount.current++;
          setTimeout(() => pollOrderById(oid), 2000);
          return;
        }
        // Order not found after many retries — webhook may still be processing; show friendly message
        setStatus('timeout');
        setOrder({ order_id: oid });
        return;
      }

      const data = await res.json();

      if (data.airalo_order_id && data.qr_code) {
        // Order fulfilled by webhook
        setOrder(data);
        setStatus('ready');
      } else if (pollCount.current < maxPolls) {
        // Not ready yet, keep polling
        pollCount.current++;
        setTimeout(() => pollOrderById(oid), 2000);
      } else {
        // Timeout — webhook might be slow
        setStatus('timeout');
        setOrder(data);
      }
    } catch (e) {
      if (pollCount.current < maxPolls) {
        pollCount.current++;
        setTimeout(() => pollOrderById(oid), 2000);
      } else {
        // Network/other error — don't show "Something went wrong"; payment likely succeeded
        setStatus('timeout');
        setOrder({ order_id: oid });
      }
    }
  }

  if (isCancel) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
          <p className="text-white/50 mb-6">Your payment was cancelled. No charges were made.</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Processing */}
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Setting up your eSIM...</h1>
            <p className="text-white/50 mb-2">This usually takes 10-30 seconds.</p>
            <p className="text-white/30 text-sm">Do not close this page.</p>
          </>
        )}

        {/* Ready — QR code */}
        {status === 'ready' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Your eSIM is ready!</h1>
            {order?.plan_name && (
              <p className="text-white/50 mb-4">{order.plan_name}</p>
            )}

            {order?.qr_code && (
              <div className="bg-white p-4 rounded-2xl inline-block mb-6">
                <img src={order.qr_code} alt="eSIM QR Code" className="w-56 h-56" />
              </div>
            )}

            {order?.direct_apple_installation_url && (
              <a
                href={order.direct_apple_installation_url}
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition mb-3"
              >
                Install on iPhone
              </a>
            )}

            {!order?.qr_code && order?.email && (
              <p className="text-white/50 mb-4">
                Your eSIM details have been sent to <strong className="text-white">{order.email}</strong>
              </p>
            )}

            {order?.iccid && (
              <p className="text-white/30 text-xs mt-2">ICCID: {order.iccid}</p>
            )}

            <div className="mt-6 space-y-3">
              <a href="/dashboard" className="block w-full px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">
                Go to Dashboard
              </a>
              <a href="/" className="block text-white/40 text-sm hover:text-white/60 transition">
                Back to Home
              </a>
            </div>
          </>
        )}

        {/* Timeout — webhook slow or order not found yet */}
        {status === 'timeout' && (
          <>
            <Loader2 className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Almost there...</h1>
            <p className="text-white/50 mb-4">
              Your payment was received. Your eSIM is being provisioned and will be ready shortly.
            </p>
            <p className="text-white/40 text-sm mb-4">
              If you already received your eSIM, you can find it in your dashboard.
            </p>
            {order?.customer_email && (
              <p className="text-white/50 mb-4">
                We'll send your eSIM details to <strong className="text-white">{order.customer_email}</strong>
              </p>
            )}
            <a href="/dashboard" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Check Dashboard
            </a>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-white/50 mb-6">{error || 'An unexpected error occurred.'}</p>
            <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Back to Home
            </a>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
