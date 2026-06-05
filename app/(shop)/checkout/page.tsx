"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getUser, addUserAddress } from "@/lib/firestore";
import { Address } from "@/types";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { AddressForm } from "@/components/checkout/AddressForm";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SHIPPING_FEE, TAX_RATE } from "@/lib/utils";
import { AddressInput } from "@/lib/validations";

const STEPS = ["Address", "Review Order", "Payment"];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, couponDiscount } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getUser(user.uid).then((u) => {
        const addrs = u?.addresses || [];
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && items.length === 0) {
      router.push("/cart");
    }
  }, [items, authLoading, router]);

  const discount = (subtotal * couponDiscount) / 100;
  const discounted = subtotal - discount;
  const shipping = SHIPPING_FEE;
  const tax = discounted * TAX_RATE;
  const total = discounted + shipping + tax;

  const handleSaveAddress = async (data: AddressInput) => {
    if (!user) return;
    const addr = await addUserAddress(user.uid, {
      ...data,
      isDefault: data.isDefault ?? false,
    });
    setAddresses((prev) => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowAddressForm(false);
    toast("Address saved");
  };

  const handlePayment = async () => {
    if (!user || !selectedAddressId) {
      toast("Please select an address", "error");
      return;
    }
    setPayLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          addressId: selectedAddressId,
          couponDiscount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment failed", "error");
    } finally {
      setPayLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded py-2 text-center text-sm font-medium ${
              i === step
                ? "bg-primary text-white"
                : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        {step === 0 && (
          <>
            <CheckoutForm
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              {showAddressForm ? "Cancel" : "+ Add new address"}
            </button>
            {showAddressForm && (
              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <AddressForm onSubmit={handleSaveAddress} />
              </div>
            )}
            <Button
              className="mt-6"
              onClick={() => {
                if (!selectedAddressId) {
                  toast("Select an address", "error");
                  return;
                }
                setStep(1);
              }}
            >
              Continue
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <PaymentStep
              items={items}
              subtotal={discounted}
              shipping={shipping}
              tax={tax}
              total={total}
              onPay={() => {}}
            />
            <div className="mt-4 flex gap-4">
              <Button variant="outline" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={() => setStep(2)}>Continue to Payment</Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <PaymentStep
              items={items}
              subtotal={discounted}
              shipping={shipping}
              tax={tax}
              total={total}
              onPay={handlePayment}
              loading={payLoading}
            />
            <Button variant="outline" className="mt-4" onClick={() => setStep(1)}>
              Back
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
