'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  Wallet,
  TrendingUp,
  CheckCircle,
  DollarSign,
  RefreshCw
} from 'lucide-react';

const PartnerBillingView = ({ partnerId, partnerData }) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [commissionPercentage, setCommissionPercentage] = useState(50);

  useEffect(() => {
    if (partnerId) {
      loadPartnerBillingData();
    }
  }, [partnerId]);

  const loadPartnerBillingData = async () => {
    try {
      setLoading(true);
      const commission = partnerData?.commissionPercentage || 50;
      setCommissionPercentage(commission);

      const transactionsQuery = query(
        collection(db, 'billing_transactions'),
        where('userId', '==', partnerId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      let ordersData = [];
      try {
        const ordersQuery = query(
          collection(db, 'api_usage'),
          where('userId', '==', partnerId),
          limit(100)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        ordersData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      } catch (error) {
        console.error('Error loading partner orders:', error);
      }

      const calculateSpentFromOrder = (amount, comm) => {
        if (!amount || amount === 0) return 0;
        return amount * (100 - comm) / 100;
      };
      const orderTransactions = ordersData.map(order => ({
        type: 'debit',
        amount: order.amount || 0,
        spentAmount: calculateSpentFromOrder(order.amount || 0, commission),
        description: `API Usage - ${order.packageName || order.endpoint || 'N/A'}`,
        createdAt: order.createdAt,
        isOrder: true
      }));

      const allTransactions = [...transactionsData, ...orderTransactions];
      setTransactions(allTransactions);

      const calculatedBalance = allTransactions.reduce((bal, transaction) => {
        if (transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'deposit') {
          return bal + Math.abs(transaction.amount || 0);
        } else if (transaction.type === 'debit') {
          const debitAmount = transaction.spentAmount || transaction.amount || 0;
          return bal - Math.abs(debitAmount);
        }
        return bal;
      }, 0);
      setBalance(calculatedBalance);
    } catch (error) {
      console.error('Error loading partner billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Partner Balance</h3>
            <p className="text-sm text-gray-600 mt-1">
              Commission Rate: {commissionPercentage}% to partner, {100 - commissionPercentage}% to platform
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              ${(partnerData?.balance || balance || 0).toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Available Balance</p>
          </div>
          <button
            onClick={loadPartnerBillingData}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Credits</p>
            <p className="text-xl font-bold text-green-600">
              ${transactions
                .filter(t => t.type === 'credit' || t.type === 'topup' || t.type === 'deposit')
                .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-xl font-bold text-red-600">
              ${transactions
                .filter(t => t.type === 'debit')
                .reduce((sum, t) => sum + Math.abs(t.spentAmount || t.amount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Transactions</p>
            <p className="text-xl font-bold text-blue-600">{transactions.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Transaction History</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600">Transaction history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(transaction.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.description || 'Balance Top-up'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type || 'credit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'deposit'
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'deposit' ? '+' : '-'}
                        ${(transaction.type === 'credit' || transaction.type === 'topup' || transaction.type === 'deposit'
                          ? Math.abs(transaction.amount || 0)
                          : Math.abs(transaction.spentAmount || transaction.amount || 0)
                        ).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.status || 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerBillingView;
