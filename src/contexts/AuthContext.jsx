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
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { generateOTPWithTimestamp } from '../utils/otpUtils';
import { sendVerificationEmail } from '../services/emailService';
import { hasAdminAccess, hasSuperAdminAccess, hasAdminPermission } from '../services/adminService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

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
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          role: 'customer'
        });
      }
      
      return user;
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
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: pendingSignup.displayName,
        createdAt: new Date(),
        role: 'customer',
        emailVerified: true
      });

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
        
        // First try to get by UID
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        console.log('📄 AuthContext: Document exists by UID:', userDoc.exists());
        
        let profileData = null;
        
        if (userDoc.exists()) {
          profileData = userDoc.data();
          console.log('📋 AuthContext: User profile loaded by UID:', profileData);
          console.log('🔐 AuthContext: Role from profile:', profileData.role);
        }
        
        // Always also check by email to find admin documents
        console.log('🔍 AuthContext: Also checking by email for admin documents...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', currentUser.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Look for admin role first
          let adminDoc = null;
          for (const doc of querySnapshot.docs) {
            const data = doc.data();
            if (data.role === 'admin' || data.role === 'super_admin') {
              adminDoc = doc;
              break;
            }
          }
          
          if (adminDoc) {
            const adminProfileData = adminDoc.data();
            console.log('👑 AuthContext: Found admin document by email:', adminProfileData);
            console.log('🔐 AuthContext: Admin role from profile:', adminProfileData.role);
            console.log('🆔 AuthContext: Admin Document ID:', adminDoc.id);
            setUserProfile(adminProfileData);
          } else if (profileData) {
            console.log('👤 AuthContext: No admin found, using UID document');
            setUserProfile(profileData);
          } else {
            console.log('❌ AuthContext: No documents found');
          }
        } else if (profileData) {
          console.log('👤 AuthContext: No email matches, using UID document');
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
    verifyEmailOTP,
    updateUserProfile,
    loadUserProfile,
    // Admin functions
    hasAdminAccess: () => hasAdminAccess(userProfile),
    hasSuperAdminAccess: () => hasSuperAdminAccess(userProfile),
    hasAdminPermission: (permission) => hasAdminPermission(userProfile, permission)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

