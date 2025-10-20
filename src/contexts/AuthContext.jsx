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
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateOTPWithTimestamp } from '../utils/otpUtils';
import { sendVerificationEmail } from '../services/emailService';
import { processReferralUsage } from '../services/referralService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  async function signup(email, password, displayName, referralCode = null) {
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
        referralCode,
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
        // Create user profile directly
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          role: 'customer',
          emailVerified: true,
          referredBy: null,
          referralCodeUsed: false
        });

        // Automatically add user to newsletter collection
        try {
          await addToNewsletter(user.email, user.displayName, 'web_dashboard');
          console.log('✅ User automatically added to newsletter via Google Sign In');
        } catch (newsletterError) {
          console.error('❌ Error adding user to newsletter:', newsletterError);
          // Don't fail the signup if newsletter addition fails
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

      const userData = JSON.parse(pendingUserData);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        displayName: currentUser.displayName,
        createdAt: new Date(),
        role: 'customer',
        emailVerified: true,
        referredBy: userData.referralCode || null,
        referralCodeUsed: !!userData.referralCode
      });

      // Process referral code if provided
      if (userData.referralCode && userData.referralCode.trim() !== '') {
        try {
          console.log('🎁 Processing referral code:', userData.referralCode);
          await processReferralUsage(userData.referralCode, currentUser.uid);
          console.log('✅ Referral processed successfully');
        } catch (referralError) {
          console.error('❌ Error processing referral:', referralError);
          // Don't fail the signup if referral processing fails
        }
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

      // Check for referral code from pendingUserData
      const pendingUserData = localStorage.getItem('pendingUserData');
      let referralCode = pendingSignup.referralCode || null;
      
      if (pendingUserData) {
        const userData = JSON.parse(pendingUserData);
        referralCode = userData.referralCode || referralCode;
        // Clean up pendingUserData
        localStorage.removeItem('pendingUserData');
      }

      // Create Firebase account only after successful verification
      const { user } = await createUserWithEmailAndPassword(auth, pendingSignup.email, pendingSignup.password);
      
      // Update profile with display name
      await updateProfile(user, { displayName: pendingSignup.displayName });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: pendingSignup.displayName,
        createdAt: new Date(),
        role: 'customer',
        emailVerified: true,
        referredBy: referralCode || null, // Track if user was referred
        referralCodeUsed: !!referralCode // Boolean flag for easy checking
      });

      // Process referral code if provided
      if (referralCode && referralCode.trim() !== '') {
        try {
          console.log('🎁 Processing referral code:', referralCode);
          await processReferralUsage(referralCode, user.uid);
          console.log('✅ Referral processed successfully');
        } catch (referralError) {
          console.error('❌ Error processing referral:', referralError);
          // Don't fail the signup if referral processing fails
        }
      }

      // Automatically add user to newsletter collection
      try {
        await addToNewsletter(user.email, pendingSignup.displayName, 'web_dashboard');
        console.log('✅ User automatically added to newsletter');
      } catch (newsletterError) {
        console.error('❌ Error adding user to newsletter:', newsletterError);
        // Don't fail the signup if newsletter addition fails
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 AuthContext: Auth state changed, user:', user?.email);
      setCurrentUser(user);
      if (user) {
        console.log('📞 AuthContext: Calling loadUserProfile...');
        try {
          await loadUserProfile();
          console.log('✅ AuthContext: loadUserProfile completed');
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
  }, [loadUserProfile]);

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

  // Helper function to add user to newsletter collection
  // Fixed: displayName and source parameters are used in the addDoc call below
  async function addToNewsletter(email, displayName, source) {
    try {
      // Check if email already exists in newsletter collection
      const existingQuery = query(
        collection(db, 'newsletter'),
        where('email', '==', email)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.empty) {
        // Create new newsletter subscription with all provided data
        await addDoc(collection(db, 'newsletter'), {
          email: email,
          displayName: displayName,
          source: source,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding user to newsletter:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

