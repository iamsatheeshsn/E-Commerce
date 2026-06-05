"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { getUser } from "@/lib/firestore";
import { BRAND_NAME } from "@/lib/brand";
import { Logo } from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { signIn } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const navigateAfterLogin = async (uid: string) => {
    const profile = await getUser(uid);
    const target =
      redirect.startsWith("/admin") && profile?.role === "admin"
        ? redirect
        : profile?.role === "admin" && redirect === "/"
          ? "/admin/dashboard"
          : redirect;
    router.push(target);
  };

  const onSubmit = async (data: LoginInput) => {
    try {
      const cred = await signIn(data.email, data.password);
      toast("Welcome back!");
      await navigateAfterLogin(cred.uid);
    } catch {
      toast("Invalid email or password", "error");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo href="/" variant="dark" />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-2 text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-muted">Sign in to your {BRAND_NAME} account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          New to {BRAND_NAME}?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          <Link href="/admin/dashboard" className="text-primary hover:underline">
            Admin panel
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
