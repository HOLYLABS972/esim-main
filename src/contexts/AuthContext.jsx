'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase/config';

const AuthContext = createContext();

const PROFILE_CACHE_MS = 2 * 60 * 1000; // 2 minutes
const profileCache = new Map();
const profileInFlight = new Map();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  async function signup(email, password, displayName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      });
      if (error) throw error;

      // Create user profile
      if (data.user) {
        await supabase.from('user_profiles').upsert({
          id: data.user.id,
          email,
          display_name: displayName,
          role: 'customer',
          email_verified: false,
          created_at: new Date().toISOString(),
        });
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    if (error) throw error;
    return data;
  }

  async function completeGoogleSignup() {
    // Supabase handles this automatically via OAuth flow
    return currentUser;
  }

  async function verifyEmailOTP(otp) {
    // For Supabase, email verification is handled via magic link or OTP
    // This is kept for compatibility — adjust if using Supabase OTP
    throw new Error('Please check your email for verification link');
  }

  async function updateUserProfile(updates) {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: currentUser.id, ...updates, updated_at: new Date().toISOString() });
      if (error) throw error;
      setUserProfile(prev => ({ ...prev, ...updates }));
      profileCache.delete(currentUser.id);
    } catch (error) {
      throw error;
    }
  }

  const loadUserProfile = useCallback(async (user) => {
    const targetUser = user || currentUser;
    if (!targetUser?.id) return;

    const userId = targetUser.id;

    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.ts < PROFILE_CACHE_MS) {
      setUserProfile(cached.profile);
      return;
    }

    let promise = profileInFlight.get(userId);
    if (promise) {
      const profile = await promise;
      if (profile) setUserProfile(profile);
      return;
    }

    promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          profileCache.set(userId, { profile: data, ts: Date.now() });
          return data;
        }
        if (error?.code === 'PGRST116') {
          const newProfile = {
            id: userId,
            email: targetUser.email,
            display_name: targetUser.user_metadata?.display_name || targetUser.user_metadata?.full_name || '',
            role: 'customer',
            email_verified: !!targetUser.email_confirmed_at,
            created_at: new Date().toISOString(),
          };
          await supabase.from('user_profiles').upsert(newProfile);
          profileCache.set(userId, { profile: newProfile, ts: Date.now() });
          return newProfile;
        }
        return null;
      } catch (err) {
        console.error('Error loading user profile:', err);
        return null;
      } finally {
        profileInFlight.delete(userId);
      }
    })();

    profileInFlight.set(userId, promise);
    const profile = await promise;
    if (profile) setUserProfile(profile);
  }, [currentUser]);

  const loadUserProfileRef = useRef(loadUserProfile);
  loadUserProfileRef.current = loadUserProfile;

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const user = session?.user || null;
      setCurrentUser(user ? {
        ...user,
        uid: user.id, // compatibility with Firebase-style uid
        displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email,
      } : null);
      if (user) loadUserProfileRef.current(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user || null;
      setCurrentUser(user ? {
        ...user,
        uid: user.id,
        displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email,
      } : null);
      if (user) {
        loadUserProfileRef.current(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Single subscription; loadUserProfile called via ref to avoid re-running effect

  const getUserType = () => {
    if (!userProfile) return null;
    return (userProfile.role === 'admin' || userProfile.role === 'super_admin') ? 'admin' : 'customer';
  };

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
    loadUserProfile,
    getUserType,
    hasAdminAccess: () => userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
    hasSuperAdminAccess: () => userProfile?.role === 'super_admin',
    hasAdminPermission: () => userProfile?.role === 'admin' || userProfile?.role === 'super_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
