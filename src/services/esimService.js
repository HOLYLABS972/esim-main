// API routes for eSIM operations (replacing Cloud Functions)

export const esimService = {
  // Create Airalo eSIM order
  async createAiraloOrder(orderData) {
    try {
      const response = await fetch('/api/airalo/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      return result;
    } catch (error) {
      console.error('Error creating Airalo eSIM order:', error);
      throw error;
    }
  },

  // Create Airalo eSIM order with full API support
  async createAiraloOrderV2({
    package_id,
    quantity = "1",
    type = "sim",
    description,
    brand_settings_name,
    to_email,
    sharing_option = ["link"],
    copy_address
  }) {
    try {
      const response = await fetch('/api/airalo/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id,
          quantity,
          type,
          description,
          brand_settings_name,
          to_email,
          sharing_option,
          copy_address
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      return result;
    } catch (error) {
      console.error('Error creating Airalo eSIM order:', error);
      throw error;
    }
  },

  // Get eSIM QR code
  async getEsimQrCode(orderId) {
    try {
      const response = await fetch('/api/airalo/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get QR code');
      }

      return result;
    } catch (error) {
      console.error('Error getting eSIM QR code:', error);
      throw error;
    }
  },

  // Fetch plans from Firestore
  async fetchPlans(countryCode = null, limit = 50) {
    try {
      const params = new URLSearchParams();
      if (countryCode) params.append('country', countryCode);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/airalo/plans?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch plans');
      }

      return result;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Fetch countries from Firestore
  async fetchCountries(limit = 100) {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());

      const response = await fetch(`/api/airalo/countries?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch countries');
      }

      return result;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  // Sync all data from Airalo API (admin function)
  async syncAllDataFromApi() {
    try {
      const response = await fetch('/api/sync-airalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync data');
      }

      return result;
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  },

  // Get eSIM details by ICCID
  async getEsimDetailsByIccid(iccid, include = 'order,order.status,order.user,share') {
    try {
      const response = await fetch('/api/airalo/sim-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ iccid, include })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get eSIM details');
      }

      return result;
    } catch (error) {
      console.error('Error getting eSIM details:', error);
      throw error;
    }
  },

  // Get eSIM usage data by ICCID
  async getEsimUsageByIccid(iccid) {
    try {
      const response = await fetch('/api/airalo/sim-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ iccid })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get usage data');
      }

      return result;
    } catch (error) {
      console.error('Error getting usage data:', error);
      throw error;
    }
  }
};
