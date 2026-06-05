import { Truck, ShieldCheck, RotateCcw } from "lucide-react";

const items = [
  { icon: Truck, text: "Free delivery on orders above ₹499" },
  { icon: ShieldCheck, text: "100% secure payments" },
  { icon: RotateCcw, text: "Easy 7-day returns" },
];

export function TopBar() {
  return (
    <div className="border-b border-border bg-slate-900 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-2 text-xs sm:justify-between">
        {items.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-primary-light" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
