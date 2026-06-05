"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  subscribeWishlist,
} from "@/lib/firestore";
import { useAuth } from "@/hooks/useAuth";

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlistIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeWishlist(user.uid, (ids) => {
      setWishlistIds(ids);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const add = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Sign in required");
      await addToWishlist(user.uid, productId);
    },
    [user]
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) return;
      await removeFromWishlist(user.uid, productId);
    },
    [user]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Sign in required");
      if (isWishlisted(productId)) {
        await remove(productId);
      } else {
        await add(productId);
      }
    },
    [user, isWishlisted, add, remove]
  );

  return {
    wishlistIds,
    count: wishlistIds.length,
    loading,
    isWishlisted,
    add,
    remove,
    toggle,
  };
}
