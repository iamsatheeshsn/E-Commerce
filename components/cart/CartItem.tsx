"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType } from "@/types";
import { formatPrice, BLUR_DATA_URL, PLACEHOLDER_IMAGE } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex gap-4 border-b py-4 dark:border-gray-700">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded">
        <Image
          src={item.image || PLACEHOLDER_IMAGE}
          alt={item.name}
          fill
          className="object-contain"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </div>
      <div className="flex flex-1 flex-col">
        <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
        <p className="mt-1 font-semibold text-primary">
          {formatPrice(item.price)}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded border">
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.productId)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold">
        {formatPrice(item.price * item.quantity)}
      </p>
    </div>
  );
}
