"use client";

import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

export function useCart() {
  const store = useCartStore();

  const addToCart = (product: Product, quantity = 1) => {
    store.addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity,
    });
  };

  return {
    items: store.items,
    isOpen: store.isOpen,
    couponCode: store.couponCode,
    couponDiscount: store.couponDiscount,
    addToCart,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    setOpen: store.setOpen,
    applyCoupon: store.applyCoupon,
    itemCount: store.getItemCount(),
    subtotal: store.getSubtotal(),
  };
}
