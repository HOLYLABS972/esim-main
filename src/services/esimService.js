import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Firebase Functions for eSIM operations
const createOrderFn = httpsCallable(functions, 'createOrder');
const createAiraloOrderFn = httpsCallable(functions, 'createAiraloOrder');
const getEsimQrCodeFn = httpsCallable(functions, 'getEsimQrCode');
const checkEsimCapacityFn = httpsCallable(functions, 'checkEsimCapacity');
const fetchPlansFn = httpsCallable(functions, 'fetchPlans');
const syncCountriesFromApiFn = httpsCallable(functions, 'syncCountriesFromApi');
const syncRegionsFromApiFn = httpsCallable(functions, 'syncRegionsFromApi');
const syncPlansFromApiFn = httpsCallable(functions, 'syncPlansFromApi');
const syncAllDataFromApiFn = httpsCallable(functions, 'syncAllDataFromApi');

export const esimService = {
  // Create eSIM order (legacy)
  async createOrder(orderData) {
    try {
      const result = await createOrderFn(orderData);
      return result.data;
    } catch (error) {
      console.error('Error creating eSIM order:', error);
      throw error;
    }
  },

  // Create Airalo eSIM order
  async createAiraloOrder(orderData) {
    try {
      const result = await createAiraloOrderFn(orderData);
      return result.data;
    } catch (error) {
      console.error('Error creating Airalo eSIM order:', error);
      throw error;
    }
  },

  // Fetch plans from Airalo API
  async fetchPlans() {
    try {
      const result = await fetchPlansFn();
      return result.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Get eSIM QR code
  async getEsimQrCode(orderId) {
    try {
      const result = await getEsimQrCodeFn({ orderId });
      return result.data;
    } catch (error) {
      console.error('Error getting eSIM QR code:', error);
      throw error;
    }
  },

  // Check eSIM capacity
  async checkEsimCapacity(planId) {
    try {
      const result = await checkEsimCapacityFn({ planId });
      return result.data;
    } catch (error) {
      console.error('Error checking eSIM capacity:', error);
      throw error;
    }
  },

  // Sync countries from API
  async syncCountriesFromApi() {
    try {
      const result = await syncCountriesFromApiFn();
      return result.data;
    } catch (error) {
      console.error('Error syncing countries:', error);
      throw error;
    }
  },

  // Sync regions from API
  async syncRegionsFromApi() {
    try {
      const result = await syncRegionsFromApiFn();
      return result.data;
    } catch (error) {
      console.error('Error syncing regions:', error);
      throw error;
    }
  },

  // Sync plans from API
  async syncPlansFromApi() {
    try {
      const result = await syncPlansFromApiFn();
      return result.data;
    } catch (error) {
      console.error('Error syncing plans:', error);
      throw error;
    }
  },

  // Sync all data from API
  async syncAllDataFromApi() {
    try {
      const result = await syncAllDataFromApiFn();
      return result.data;
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  }
};
