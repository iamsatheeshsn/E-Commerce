"use client";

import { Address } from "@/types";
import { cn } from "@/lib/utils";

interface CheckoutFormProps {
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CheckoutForm({
  addresses,
  selectedId,
  onSelect,
}: CheckoutFormProps) {
  if (addresses.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No saved addresses. Add a new address below.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <label
          key={addr.id}
          className={cn(
            "flex cursor-pointer rounded-lg border p-4 transition",
            selectedId === addr.id
              ? "border-primary bg-primary/5"
              : "border-gray-200 dark:border-gray-700"
          )}
        >
          <input
            type="radio"
            name="address"
            value={addr.id}
            checked={selectedId === addr.id}
            onChange={() => onSelect(addr.id)}
            className="mr-3 accent-primary"
          />
          <div className="text-sm">
            <p className="font-medium">{addr.fullName}</p>
            <p className="text-gray-600 dark:text-gray-400">
              {addr.line1}
              {addr.line2 && `, ${addr.line2}`}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-gray-600 dark:text-gray-400">{addr.phone}</p>
            {addr.isDefault && (
              <span className="mt-1 inline-block text-xs text-primary">
                Default
              </span>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}
