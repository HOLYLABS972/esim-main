// Service to check business account balance via backend API
import { apiService } from './apiService';

/**
 * Get business account balance from backend
 * @returns {Promise<{balance: number, hasInsufficientFunds: boolean, minimumRequired: number}>}
 */
export const getBusinessBalance = async () => {
  try {
    console.log('💰 Checking business account balance via backend...');
    
    // Call backend API to get balance
    const result = await apiService.getBalance();
    
    console.log('💰 Balance check results:', {
      balance: result.balance,
      minimumRequired: result.minimumRequired,
      hasInsufficientFunds: result.hasInsufficientFunds
    });
    
    return {
      balance: result.balance || 0,
      hasInsufficientFunds: result.hasInsufficientFunds || false,
      minimumRequired: result.minimumRequired || 4.0
    };
  } catch (error) {
    console.error('❌ Error checking business balance:', error);
    // Return safe defaults in case of error
    return {
      balance: 0,
      hasInsufficientFunds: true,
      minimumRequired: 4.0
    };
  }
};

