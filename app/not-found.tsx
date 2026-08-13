"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Text, Button } from "@/components/common";
import Logo from "@/components/common/Logo";

/**
 * Ambient brand orbs drifting behind the content.
 * Each one starts its float at a different point so they never move in
 * lockstep.
 */
const orbs = [
  {
    className:
      "-left-16 top-4 h-56 w-56 bg-primary/20 sm:h-72 sm:w-72 md:-left-10",
    delay: "0s",
  },
  {
    className:
      "-right-20 top-1/3 h-64 w-64 bg-orange/20 sm:h-80 sm:w-80 md:-right-12",
    delay: "1.6s",
  },
  {
    className:
      "bottom-0 left-1/3 h-48 w-48 bg-secondary/15 sm:h-64 sm:w-64",
    delay: "3.2s",
  },
];

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-milkwhite px-4 py-16">
      {/* Soft brand wash */}
      {orbs.map((orb, index) => (
        <span
          key={index}
          aria-hidden
          style={{ animationDelay: orb.delay }}
          className={`animate-viju-float pointer-events-none absolute rounded-full blur-3xl ${orb.className}`}
        />
      ))}

      <div className="relative w-full max-w-2xl text-center">
        {/* Logo with a pulsing brand halo */}
        <div className="animate-viju-rise flex justify-center">
          <div className="relative">
            <span
              aria-hidden
              className="animate-viju-halo absolute inset-0 rounded-2xl bg-linear-to-r from-primary via-orange to-primary blur-lg"
            />
            <Logo
              width="w-16"
              height="h-16"
              className="relative rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* 404 - brand gradient with a slow sheen sweeping across it */}
        <div
          className="animate-viju-rise mt-8"
          style={{ animationDelay: "0.1s" }}
        >
          <p
            aria-hidden
            className="animate-viju-sheen bg-linear-to-r from-primary via-orange to-primary bg-clip-text font-display text-[6.5rem] font-bold leading-none text-transparent sm:text-[9rem] lg:text-[11rem]"
          >
            404
          </p>
        </div>

        {/* Message */}
        <div
          className="animate-viju-rise mt-2"
          style={{ animationDelay: "0.2s" }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Oops! Page Not Found
          </h1>

          <Text
            variant="body"
            color="muted"
            className="mx-auto mt-4 max-w-md leading-relaxed"
          >
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </Text>
        </div>

        {/* Actions */}
        <div
          className="animate-viju-rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.3s" }}
        >
          {/* A real link, so the primary action supports middle-click and
              open-in-new-tab like any other navigation */}
          <Link
            href="/"
            className="group flex w-full items-center justify-center gap-2 rounded-md bg-linear-to-r from-primary via-orange to-primary px-6 py-3 text-lg font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 sm:w-auto"
          >
            <Home
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5"
              strokeWidth={2}
            />
            Back to Home
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="group flex w-full items-center justify-center gap-2 border-muted/30 bg-white transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary sm:w-auto"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              strokeWidth={2}
            />
            Go Back
          </Button>
        </div>

        {/* Footer hint */}
        <div
          className="animate-viju-rise mt-12 flex items-center justify-center gap-2"
          style={{ animationDelay: "0.4s" }}
        >
          <Compass className="h-3.5 w-3.5 text-muted" strokeWidth={2} />
          <Text variant="caption" color="muted">
            Lost? Head back to your dashboard and pick up where you left off.
          </Text>
        </div>
      </div>
    </main>
  );
}
