"use client";

import { useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  signInWithEmail,
  signInWithGoogle,
  registerWithEmail,
  signOut,
  ensureUserDocument,
  syncSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { getUser } from "@/lib/firestore";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const {
    firebaseUser,
    userProfile,
    loading,
    setFirebaseUser,
    setUserProfile,
    setLoading,
    getRole,
  } = useAuthStore();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await ensureUserDocument(user);
          setUserProfile(profile);
          const token = await user.getIdToken();
          await syncSessionCookie(token);
        } catch {
          const profile = await getUser(user.uid);
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [setFirebaseUser, setUserProfile, setLoading]);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const user = await registerWithEmail(email, password, displayName);
      const token = await user.getIdToken();
      await syncSessionCookie(token);
      return user;
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await signInWithEmail(email, password);
    const token = await user.getIdToken();
    await syncSessionCookie(token);
    return user;
  }, []);

  const signInGoogle = useCallback(async () => {
    const user = await signInWithGoogle();
    const token = await user.getIdToken();
    await syncSessionCookie(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await clearSessionCookie();
    await signOut();
    setUserProfile(null);
    setFirebaseUser(null);
  }, [setFirebaseUser, setUserProfile]);

  return {
    user: firebaseUser,
    userProfile,
    loading,
    role: getRole(),
    signIn,
    signInWithGoogle: signInGoogle,
    signOut: logout,
    register,
    isAdmin: getRole() === "admin",
  };
}
