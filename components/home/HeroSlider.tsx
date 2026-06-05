"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  gradient: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    const duration = 5500;
    const tick = 50;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + (tick / duration) * 100;
      });
    }, tick);
    return () => clearInterval(timer);
  }, [next, index]);

  if (!slides.length) return null;

  return (
    <section className="relative bg-slate-900">
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="relative aspect-[2.4/1] min-h-[240px] overflow-hidden rounded-3xl shadow-2xl md:min-h-[380px]">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-all duration-700 ease-out",
                i === index
                  ? "z-10 scale-100 opacity-100"
                  : "z-0 scale-105 opacity-0"
              )}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
              />
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r",
                  slide.gradient
                )}
              />
              <div className="relative flex h-full flex-col justify-center px-8 md:px-14 lg:px-20">
                <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  NovaCart Exclusive
                </span>
                <h1 className="max-w-2xl text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 md:text-lg">
                  {slide.subtitle}
                </p>
                <Link href={slide.href} className="mt-8 w-fit">
                  <Button
                    size="lg"
                    className="rounded-full bg-white px-8 font-semibold text-slate-900 shadow-lg hover:bg-white/90"
                  >
                    {slide.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2.5 text-white backdrop-blur transition hover:bg-black/40 md:left-6"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2.5 text-white backdrop-blur transition hover:bg-black/40 md:right-6"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end gap-3 px-6 pb-5 md:px-10">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIndex(i);
                    setProgress(0);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index
                      ? "w-10 bg-white"
                      : "w-3 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            {slides.length > 1 && (
              <div className="ml-auto hidden h-1 w-32 overflow-hidden rounded-full bg-white/20 md:block">
                <div
                  className="h-full rounded-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
