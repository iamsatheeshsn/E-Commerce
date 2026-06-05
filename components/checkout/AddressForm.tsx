"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, AddressInput } from "@/lib/validations";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface AddressFormProps {
  onSubmit: (data: AddressInput) => void;
  loading?: boolean;
}

export function AddressForm({ onSubmit, loading }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { isDefault: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        {...register("fullName")}
        error={errors.fullName?.message}
      />
      <Input
        label="Phone"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Input
        label="Address Line 1"
        {...register("line1")}
        error={errors.line1?.message}
      />
      <Input label="Address Line 2" {...register("line2")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="City"
          {...register("city")}
          error={errors.city?.message}
        />
        <Input
          label="State"
          {...register("state")}
          error={errors.state?.message}
        />
      </div>
      <Input
        label="Pincode"
        {...register("pincode")}
        error={errors.pincode?.message}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("isDefault")} className="accent-primary" />
        Set as default address
      </label>
      <Button type="submit" loading={loading}>
        Save Address
      </Button>
    </form>
  );
}
