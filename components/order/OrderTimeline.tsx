"use client";

import { format } from "date-fns";
import { Check } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const currentIndex = STEPS.indexOf(
    order.status === "cancelled" ? "pending" : order.status
  );

  return (
    <div className="space-y-0">
      {STEPS.map((step, index) => {
        const event = order.timeline?.find(
          (e) => e.status === step
        );
        const isComplete = index <= currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  isComplete
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                )}
              >
                {isComplete && <Check className="h-4 w-4" />}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-12 w-0.5",
                    isComplete ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={cn(
                  "font-medium capitalize",
                  isComplete ? "text-gray-900 dark:text-white" : "text-gray-400"
                )}
              >
                {step}
              </p>
              {event && (
                <>
                  <p className="text-sm text-gray-500">{event.message}</p>
                  <p className="text-xs text-gray-400">
                    {event.timestamp?.toDate?.()
                      ? format(event.timestamp.toDate(), "dd MMM yyyy, hh:mm a")
                      : ""}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
