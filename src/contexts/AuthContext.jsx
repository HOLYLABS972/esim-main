'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateOTPWithTimestamp } from '../utils/otpUtils';
import { sendVerificationEmail } from '../services/emailService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Helper to fetch user's public IP address (best-effort)
  async function getUserIpAddress() {
    try {
      // Use a simple public IP service; keep this try/catch in case it fails or is blocked
      const res = await fetch('https://api.ipify.org?format=json');
      if (!res.ok) return null;
      const data = await res.json();
      return data.ip || null;
    } catch (err) {
      console.warn('Could not retrieve user IP address:', err);
      return null;
    }
  }
  async function signup(email, password, displayName) {
    try {
      // Generate and send verification OTP first (before creating account)
      const otpData = generateOTPWithTimestamp(10); // 10 minutes expiry
      const emailSent = await sendVerificationEmail(email, displayName, otpData.otp);
      
      if (emailSent) {
        console.log(`✅ Verification OTP sent to ${email}: ${otpData.otp}`);
      } else {
        console.log(`📧 OTP Code for ${email}: ${otpData.otp}`);
      }
      
      // Store pending signup data in localStorage (not in Firebase yet)
      const pendingSignup = {
        email,
        password,
        displayName,
        otp: otpData.otp,
        expiresAt: otpData.expiresAt,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pendingSignup', JSON.stringify(pendingSignup));
      
      return { pending: true, otp: otpData.otp };
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Update last login timestamp and IP (best-effort)
      try {
        const ip = await getUserIpAddress();
        const updates = {
          lastLoginAt: new Date(),
        };
        if (ip) updates.lastLoginIp = ip;
        await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      } catch (err) {
        console.warn('Failed to update last login info:', err);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create user profile directly and store IP (best-effort)
        try {
          const ip = await getUserIpAddress();
          const base = {
            email: user.email,
            displayName: user.displayName,
            createdAt: new Date(),
            role: 'customer',
            emailVerified: true,
          };
          if (ip) base.ipAddress = ip;
          await setDoc(doc(db, 'users', user.uid), base);
        } catch (err) {
          console.warn('Failed to save user IP on Google sign-in:', err);
          // Fallback: create user without IP
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            createdAt: new Date(),
            role: 'customer',
            emailVerified: true
          });
        }

      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function completeGoogleSignup() {
    try {
      const pendingUserData = localStorage.getItem('pendingUserData');
      if (!pendingUserData) {
        throw new Error('No pending user data found');
      }

  JSON.parse(pendingUserData);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Create user profile in Firestore and attempt to save IP
      try {
        const ip = await getUserIpAddress();
        const base = {
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: new Date(),
          role: 'customer',
          emailVerified: true,
        };
        if (ip) base.ipAddress = ip;
        await setDoc(doc(db, 'users', currentUser.uid), base);
      } catch (err) {
        console.warn('Failed to save user IP during completeGoogleSignup:', err);
        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: new Date(),
          role: 'customer',
          emailVerified: true
        });
      }

      // Clean up pending data
      localStorage.removeItem('pendingUserData');
      
      return currentUser;
    } catch (error) {
      throw error;
    }
  }

  async function verifyEmailOTP(otp) {
    try {
      // Check if there's a pending signup
      const pendingSignupData = localStorage.getItem('pendingSignup');
      if (!pendingSignupData) {
        throw new Error('No pending signup found');
      }

      const pendingSignup = JSON.parse(pendingSignupData);
      
      // Check if OTP has expired
      if (Date.now() > pendingSignup.expiresAt) {
        localStorage.removeItem('pendingSignup');
        throw new Error('Verification OTP has expired');
      }

      // Verify OTP
      if (otp !== pendingSignup.otp) {
        throw new Error('Invalid verification OTP');
      }

  // Create Firebase account only after successful verification
  const { user } = await createUserWithEmailAndPassword(auth, pendingSignup.email, pendingSignup.password);
      
      // Update profile with display name
      await updateProfile(user, { displayName: pendingSignup.displayName });
      
      // Create user profile in Firestore and attempt to save IP
      try {
        const ip = await getUserIpAddress();
        const base = {
          email: user.email,
          displayName: pendingSignup.displayName,
          createdAt: new Date(),
          role: 'customer',
          emailVerified: true,
        };
        if (ip) base.ipAddress = ip;
        await setDoc(doc(db, 'users', user.uid), base);
      } catch (err) {
        console.warn('Failed to save user IP during signup verification:', err);
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: pendingSignup.displayName,
          createdAt: new Date(),
          role: 'customer',
          emailVerified: true
        });
      }


      // Clear pending signup data
      localStorage.removeItem('pendingSignup');

      return user;
    } catch (error) {
      throw error;
    }
  }

  async function updateUserProfile(updates) {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
    } catch (error) {
      throw error;
    }
  }

  const loadUserProfile = useCallback(async () => {
    if (currentUser) {
      try {
        console.log('🔍 AuthContext: Loading user profile for:', currentUser.email);
        console.log('🆔 AuthContext: User UID:', currentUser.uid);
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        console.log('📄 AuthContext: Document exists:', userDoc.exists());
        
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          console.log('📋 AuthContext: User profile loaded:', profileData);
          setUserProfile(profileData);
        } else {
          console.log('❌ AuthContext: No user profile found');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error loading user profile:', error);
      }
    }
  }, [currentUser]);

  /**
   * Migrate guest orders to user's esims collection when they log in
   * This copies orders from global orders collection to user's personal collection
   */
  const migrateGuestOrders = useCallback(async (user) => {
    if (!user || !user.email) {
      return;
    }

    try {
      console.log('🔄 AuthContext: Checking for guest orders to migrate for:', user.email);
      
      // Find all guest orders with this email
      const guestOrdersQuery = query(
        collection(db, 'orders'),
        where('customerEmail', '==', user.email),
        where('isGuest', '==', true)
      );
      
      const guestOrdersSnapshot = await getDocs(guestOrdersQuery);
      console.log('📦 AuthContext: Found', guestOrdersSnapshot.size, 'guest orders to migrate');
      
      if (guestOrdersSnapshot.empty) {
        console.log('✅ AuthContext: No guest orders to migrate');
        return;
      }

      // Use batch write for efficiency
      const batch = writeBatch(db);
      let migratedCount = 0;

      for (const orderDoc of guestOrdersSnapshot.docs) {
        try {
          const orderData = orderDoc.data();
          const orderId = orderData.orderId || orderDoc.id;
          
          // Check if order already exists in user's collection
          const userOrderRef = doc(db, 'users', user.uid, 'esims', orderId);
          const userOrderDoc = await getDoc(userOrderRef);
          
          if (userOrderDoc.exists()) {
            console.log('⏭️ AuthContext: Order already exists in user collection, skipping:', orderId);
            continue;
          }

          // Prepare order data for user collection
          // Extract country info if available
          const countryInfo = {
            code: orderData.countryCode || 'US',
            name: orderData.countryName || 'United States'
          };

          // Extract QR code data from multiple possible locations
          const airaloOrderData = orderData.airaloOrderData || {};
          const sims = airaloOrderData.sims || [];
          const firstSim = sims[0] || {};
          const orderResult = orderData.orderResult || {};

          const esimData = {
            // Basic order info
            orderId: orderId,
            planId: orderData.planId,
            planName: orderData.planName,
            amount: orderData.amount || orderData.price || 0,
            currency: orderData.currency || 'usd',
            status: orderData.status || 'active',
            customerEmail: orderData.customerEmail,
            
            // Country info
            countryCode: countryInfo.code,
            countryName: countryInfo.name,
            
            // QR code data
            qrCode: orderData.qrCode || orderResult.qrCode || firstSim.qr_code || firstSim.qrCode || '',
            qrCodeUrl: orderData.qrCodeUrl || firstSim.qr_code_url || firstSim.qrCodeUrl || '',
            directAppleInstallationUrl: orderData.directAppleInstallationUrl || firstSim.direct_apple_installation_url || firstSim.directAppleInstallationUrl || '',
            iccid: orderData.iccid || orderResult.iccid || firstSim.iccid || '',
            lpa: orderData.lpa || firstSim.lpa || '',
            matchingId: orderData.matchingId || firstSim.matching_id || firstSim.matchingId || '',
            activationCode: orderData.activationCode || orderResult.activationCode || firstSim.activation_code || firstSim.activationCode || '',
            smdpAddress: orderData.smdpAddress || orderResult.smdpAddress || firstSim.smdp_address || firstSim.smdpAddress || '',
            
            // Additional data
            airaloOrderId: orderData.airaloOrderId,
            airaloOrderData: airaloOrderData,
            orderResult: orderResult,
            processingStatus: orderData.processingStatus || 'completed',
            isTestMode: orderData.isTestMode || false,
            stripeMode: orderData.stripeMode || 'live',
            
            // Timestamps
            createdAt: orderData.createdAt || serverTimestamp(),
            purchaseDate: orderData.purchaseDate || orderData.createdAt || serverTimestamp(),
            updatedAt: orderData.updatedAt || serverTimestamp(),
            completedAt: orderData.completedAt || orderData.createdAt || serverTimestamp(),
            migratedAt: serverTimestamp(), // Mark when it was migrated
            migratedFrom: 'guest_orders' // Track source
          };

          // Add to batch
          batch.set(userOrderRef, esimData);
          migratedCount++;
          
          console.log('✅ AuthContext: Queued order for migration:', orderId);
        } catch (orderError) {
          console.error('❌ AuthContext: Error processing order for migration:', orderDoc.id, orderError);
        }
      }

      // Commit all migrations in one batch
      if (migratedCount > 0) {
        await batch.commit();
        console.log(`✅ AuthContext: Successfully migrated ${migratedCount} guest order(s) to user collection`);
      } else {
        console.log('✅ AuthContext: All orders already migrated');
      }
    } catch (error) {
      console.error('❌ AuthContext: Error migrating guest orders:', error);
      // Don't throw - migration failure shouldn't block login
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 AuthContext: Auth state changed, user:', user?.email);
      setCurrentUser(user);
      if (user) {
        console.log('📞 AuthContext: Calling loadUserProfile...');
        try {
          await loadUserProfile();
          console.log('✅ AuthContext: loadUserProfile completed');
          
          // Migrate guest orders to user's collection
          console.log('🔄 AuthContext: Starting guest order migration...');
          await migrateGuestOrders(user);
        } catch (error) {
          console.error('❌ AuthContext: Error in loadUserProfile:', error);
        }
      } else {
        console.log('👋 AuthContext: User logged out, clearing profile');
        setUserProfile(null);
      }
      console.log('🏁 AuthContext: Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserProfile, migrateGuestOrders]);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    completeGoogleSignup,
    verifyEmailOTP,
    updateUserProfile,
    loadUserProfile
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

