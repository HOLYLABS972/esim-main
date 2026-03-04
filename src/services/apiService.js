// Service to call API routes for eSIM operations
// Firebase removed — uses Supabase auth
import { supabase } from '../supabase/config';

/**
 * Get Supabase access token for authentication
 */
const getAccessToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  return session.access_token;
};

export const apiService = {
  /**
   * Create an eSIM order through API route
   */
  async createOrder({ package_id, planId, quantity = "1", to_email, description, mode, isGuest = false, orderId, userId, planName, amount, currency, paymentMethod, affiliateRef }) {
    const plan_id = package_id || planId;
    
    console.log('📦 Creating order via API route:', { plan_id, quantity, to_email, mode, isGuest });
    
    if (!plan_id) throw new Error('package_id or planId is required');
    if (typeof plan_id !== 'string' || plan_id.trim() === '') throw new Error(`Invalid package_id format: ${plan_id}`);
    
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package_id: plan_id.trim(),
        quantity, to_email, orderId, userId,
        planName: planName || plan_id,
        amount, currency: currency || 'usd',
        paymentMethod: paymentMethod || 'paddle',
        isGuest, affiliateRef,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Order API error ${res.status}`);
    }

    const result = await res.json();
    console.log('✅ Order created via API:', result);
    
    return {
      orderId: result.orderId,
      airaloOrderId: result.airaloOrderId,
      orderData: result.orderData,
      esimData: result.esimData,
      qrCode: result.qrCode,
      iccid: result.iccid,
      success: true
    };
  },

  /**
   * Get QR code for an order via API route
   */
  async getQrCode(orderId) {
    console.log('📱 Getting QR code for order:', orderId);
    const res = await fetch('/api/airalo/qr-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `QR code API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Get SIM details by ICCID via API route
   */
  async getSimDetails(iccid) {
    console.log('📱 Getting SIM details for ICCID:', iccid);
    const res = await fetch('/api/airalo/sim-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iccid }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SIM details API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Get SIM usage by ICCID via API route
   */
  async getSimUsage(iccid) {
    console.log('📊 Getting SIM usage for ICCID:', iccid);
    const res = await fetch('/api/airalo/sim-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iccid }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SIM usage API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Health check
   */
  async healthCheck() {
    return { status: 'ok', message: 'Using API routes' };
  },

  /**
   * Get current user balance via API route
   */
  async getBalance() {
    console.log('💰 Fetching user balance');
    const res = await fetch('/api/user/balance', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Balance API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Create topup for existing eSIM via API route
   */
  async createTopup({ iccid, package_id }) {
    console.log('📦 Creating topup:', { iccid, package_id });
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package_id: package_id.trim(),
        iccid,
        type: 'topup',
        quantity: '1',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Topup API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Get mobile data usage/status for eSIM
   */
  async getMobileData({ iccid, orderId }) {
    console.log('📊 Getting mobile data status:', { iccid, orderId });
    const res = await fetch('/api/user/mobile-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iccid, orderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Mobile data API error ${res.status}`);
    }
    return await res.json();
  },

  /**
   * Get topup-compatible packages for an existing eSIM by ICCID
   */
  async getTopupPackages(iccid) {
    console.log('📦 Fetching topup packages for ICCID:', iccid);
    if (!iccid) throw new Error('ICCID is required to fetch topup packages');
    const res = await fetch('/api/user/topup-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iccid }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Topup packages API error ${res.status}`);
    }
    return await res.json();
  },
};
