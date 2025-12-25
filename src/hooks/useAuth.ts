/**
 * useAuth Hook - Defensive Programming Version
 * Manages Firebase authentication with Google Sign-In and Firestore integration
 * 
 * CRITICAL FIX: Uses try/catch/finally to GUARANTEE loading always completes
 */

import { useState, useEffect } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAppStore, UserPlan } from '../store/useAppStore';

export interface UserData {
  uid: string;
  email: string;
  name?: string;
  plan: UserPlan;
  credits: number;
  createdAt?: any;
  lastPurchase?: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setPlan, setCredits, setUserId } = useAppStore();

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // ============================================
  // AUTH STATE LISTENER - DEFENSIVE VERSION
  // ============================================
  useEffect(() => {
    console.log('🔄 [useAuth] Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // DEBUG: Always log auth state changes
      console.log('🔐 [useAuth] Auth State Changed:', firebaseUser?.email || 'No user');
      
      try {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          // User is logged in - Try to fetch Firestore data
          console.log('📡 [useAuth] Fetching Firestore data for:', firebaseUser.uid);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // User has Firestore profile
            const data = userDoc.data() as UserData;
            console.log('✅ [useAuth] User data loaded:', data.plan, data.credits);
            
            setUserData(data);
            setPlan(data.plan || 'FREE');
            setCredits(data.credits ?? 3);
            setUserId(firebaseUser.uid);
          } else {
            // User exists in Auth but NOT in Firestore
            // This can happen if profile creation failed
            console.warn('⚠️ [useAuth] User has no Firestore profile, creating one...');
            
            const newUserData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              plan: 'FREE',
              credits: 3,
              createdAt: serverTimestamp()
            };
            
            // Create the missing profile
            await setDoc(userDocRef, newUserData);
            
            setUserData(newUserData);
            setPlan('FREE');
            setCredits(3);
            setUserId(firebaseUser.uid);
            console.log('✅ [useAuth] Created missing Firestore profile');
          }
        } else {
          // No user - Reset everything
          console.log('👤 [useAuth] No user, resetting to guest state');
          setUserData(null);
          setPlan('FREE');
          setCredits(3);
          setUserId(null);
        }
      } catch (err: any) {
        // CRITICAL: Catch ALL errors to prevent infinite loading
        console.error('❌ [useAuth] Critical error in auth listener:', err);
        setError(err?.message || 'Authentication error');
        
        // Even on error, reset to safe state
        setUserData(null);
        setPlan('FREE');
        setCredits(3);
      } finally {
        // CRITICAL: ALWAYS stop loading, no matter what happens
        console.log('✅ [useAuth] Loading complete');
        setLoading(false);
      }
    });

    return () => {
      console.log('🔄 [useAuth] Cleaning up auth listener');
      unsubscribe();
    };
  }, [setPlan, setCredits, setUserId]);

  // ============================================
  // REFRESH USER DATA
  // ============================================
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setPlan(data.plan || 'FREE');
        setCredits(data.credits ?? 3);
        console.log('✅ [useAuth] User data refreshed:', data.plan, data.credits);
      }
    } catch (err: any) {
      console.error('❌ [useAuth] Error refreshing user data:', err);
    }
  };

  // ============================================
  // GOOGLE SIGN IN
  // ============================================
  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      // Check if user document exists
      const userDocRef = doc(db, 'users', googleUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // NEW USER: Create Firestore document
        const newUserData: UserData = {
          uid: googleUser.uid,
          email: googleUser.email || '',
          name: googleUser.displayName || '',
          plan: 'FREE',
          credits: 3,
          createdAt: serverTimestamp()
        };

        await setDoc(userDocRef, newUserData);
        console.log('✅ [useAuth] New Google user created:', googleUser.uid);

        setUserData(newUserData);
        setPlan('FREE');
        setCredits(3);
        setUserId(googleUser.uid);
      } else {
        // EXISTING USER: Load data
        const data = userDoc.data() as UserData;
        setUserData(data);
        setPlan(data.plan || 'FREE');
        setCredits(data.credits ?? 3);
        setUserId(googleUser.uid);
        console.log('✅ [useAuth] Existing Google user logged in:', googleUser.uid);
      }

      return googleUser;
    } catch (err: any) {
      console.error('❌ [useAuth] Google Sign-In error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EMAIL/PASSWORD SIGN IN
  // ============================================
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // EMAIL/PASSWORD SIGN UP
  // ============================================
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const newUserData: UserData = {
        uid: result.user.uid,
        email: result.user.email || '',
        name: name || '',
        plan: 'FREE',
        credits: 3,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', result.user.uid), newUserData);
      console.log('✅ [useAuth] New email user created:', result.user.uid);
      
      return result.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SIGN OUT
  // ============================================
  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUserData(null);
      console.log('✅ [useAuth] User signed out');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    userData,
    loading,
    error,
    loginWithGoogle,
    signIn,
    signUp,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
    isPro: userData?.plan?.toLowerCase() === 'pro' || userData?.plan?.toLowerCase() === 'starter'
  };
}
