'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, Globe, Clock, Download, Star, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const PlanCard = ({ plan, isSelected, onClick, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-green-300 hover:shadow-md ${
        isSelected 
          ? 'border-green-500 bg-green-50 shadow-lg' 
          : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          <Star size={12} className="inline mr-1" />
          Popular
        </div>
      )}

      {/* Plan Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
          <p className="text-sm text-gray-600">{plan.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">${Math.round(plan.price)}</div>
          <div className="text-xs text-gray-500">{plan.currency || 'USD'}</div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <Wifi size={16} className="mr-2 text-green-500" />
          <span>{plan.data} {plan.dataUnit}</span>
        </div>
        {plan.speed && (
          <div className="flex items-center text-sm text-gray-700">
            <Download size={16} className="mr-2 text-purple-500" />
            <span>Up to {plan.speed}</span>
          </div>
        )}
      </div>

      {/* Plan Benefits */}
      {plan.benefits && plan.benefits.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {plan.benefits.map((benefit, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
              >
                <Check size={12} className="mr-1" />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}


    </motion.div>
  );
};

const PlanSelectionBottomSheet = ({ 
  isOpen, 
  onClose, 
  availablePlans, 
  loadingPlans
}) => {
  const { currentUser } = useAuth();
  const router = useRouter();

  const handlePlanSelect = async (plan) => {
    // Check if user is authenticated
    if (!currentUser) {
      console.log('❌ User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      // Import payment service dynamically
      const { paymentService } = await import('../services/paymentService');
      
      // Create order data with real user email
      const orderData = {
        planId: plan.id,
        planName: plan.name,
        customerEmail: currentUser.email, // Must have user email
        amount: plan.price,
        currency: 'usd'
      };

      console.log('🚀 Redirecting to Stripe for plan:', plan.name);
      console.log('👤 User email:', orderData.customerEmail);

      // Redirect directly to Stripe
      await paymentService.createCheckoutSession(orderData);
      
    } catch (error) {
      console.error('Failed to redirect to payment:', error);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Plan"
      maxHeight="85vh"
    >
      <div className="p-6">



        {/* Available Plans */}
        {loadingPlans ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available plans...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the best options for you</p>
          </div>
        ) : availablePlans.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-lg">
                Available Plans ({availablePlans.length})
              </h4>
              <div className="text-sm text-gray-500">
                Best value plans
              </div>
            </div>
            
            {availablePlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                onClick={() => handlePlanSelect(plan)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any plans for your current selection
            </p>
            <p className="text-sm text-gray-500">
              Try selecting a different country or region
            </p>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-6" />
      </div>
    </BottomSheet>
  );
};

export default PlanSelectionBottomSheet;
