import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";

interface LogoProps {
  href?: string;
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
}

export function Logo({
  href = "/",
  className,
  variant = "dark",
  showText = true,
}: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt={BRAND_NAME}
        width={40}
        height={40}
        className="shrink-0"
        priority
      />
      {showText && (
        <span
          className={cn(
            "font-display text-xl font-bold tracking-tight",
            variant === "light" ? "text-white" : "text-foreground"
          )}
        >
          Nova<span className="text-primary">Cart</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
