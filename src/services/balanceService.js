// Service to check business account balance
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Calculate spent amount from order based on commission
 * @param {number} amount - Order amount
 * @param {number} commissionPercentage - Commission percentage (default 50%)
 * @returns {number} - Spent amount after commission
 */
const calculateSpentFromOrder = (amount, commissionPercentage = 50) => {
  if (!amount || amount === 0) return 0;
  return amount * (100 - commissionPercentage) / 100;
};

/**
 * Get business account balance by checking all transactions
 * @returns {Promise<{balance: number, hasInsufficientFunds: boolean, minimumRequired: number}>}
 */
export const getBusinessBalance = async () => {
  try {
    console.log('💰 Checking business account balance...');
    
    // Load billing transactions
    const billingQuery = query(
      collection(db, 'billing_transactions'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    
    const billingSnapshot = await getDocs(billingQuery);
    const billingTransactions = billingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    // Load orders from api_usage collection
    const ordersQuery = query(
      collection(db, 'api_usage'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersData = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    // Convert orders to transaction format for balance calculation
    const orderTransactions = ordersData.map(order => ({
      type: 'debit',
      amount: order.amount || 0,
      spentAmount: calculateSpentFromOrder(order.amount || 0),
      description: `API Usage - ${order.packageName || order.endpoint || 'N/A'}`,
      createdAt: order.createdAt,
      isOrder: true
    }));
    
    // Combine billing transactions and order transactions
    const allTransactions = [...billingTransactions, ...orderTransactions];
    
    // Calculate balance from all transactions
    const calculatedBalance = allTransactions.reduce((balance, transaction) => {
      if (transaction.type === 'credit' || transaction.type === 'topup') {
        // Add credits/top-ups to balance
        return balance + (transaction.amount || 0);
      } else if (transaction.type === 'debit') {
        // For debits, use spentAmount if available, otherwise use amount
        const debitAmount = transaction.spentAmount || transaction.amount || 0;
        return balance - debitAmount;
      }
      return balance;
    }, 0);
    
    const minimumRequired = 4.0; // $4 minimum
    const hasInsufficientFunds = calculatedBalance < minimumRequired;
    
    console.log('💰 Balance check results:', {
      balance: calculatedBalance,
      minimumRequired,
      hasInsufficientFunds,
      totalTransactions: allTransactions.length,
      billingTransactions: billingTransactions.length,
      orderTransactions: orderTransactions.length
    });
    
    return {
      balance: calculatedBalance,
      hasInsufficientFunds,
      minimumRequired
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

