"use client";

import { useEffect, useState } from "react";
import { getUserOrders, subscribeOrder } from "@/lib/firestore";
import { Order } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getUserOrders(user.uid)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  return { orders, loading };
}

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    const unsub = subscribeOrder(orderId, (o) => {
      setOrder(o);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  return { order, loading };
}
