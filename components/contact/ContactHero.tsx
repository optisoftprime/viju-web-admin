import React from "react";
import { MessageCircle } from "lucide-react";
import SectionHeading from "./SectionHeading";
import ContactStatCard from "./ContactStatCard";
import { contactStats } from "./contactData";

/**
 * Contact Hero
 * Badge, oversized stacked heading, intro copy and the metrics row, over the
 * plum gradient backdrop.
 */
export default function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-[#2b1f29] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14">
      {/* Warm light bleeding in from the right, cooler plum at the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 72% 45%, rgba(96, 56, 62, 0.85) 0%, rgba(58, 36, 47, 0.35) 45%, rgba(0, 0, 0, 0) 100%), radial-gradient(60% 50% at 8% 78%, rgba(70, 44, 72, 0.55) 0%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Thin decorative rings */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[28%] hidden h-40 w-40 rounded-full border border-white/7 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] top-[54%] hidden h-28 w-28 rounded-full border border-white/7 lg:block"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/6 px-6 py-3 backdrop-blur-sm">
          <MessageCircle className="h-4 w-4 text-[#f0873f]" strokeWidth={2} />
          <span className="text-[15px] font-bold text-[#f0873f]">
            Let&apos;s Start a Conversation
          </span>
          <span className="h-2 w-2 rounded-full bg-[#e8503a]" />
        </span>

        {/* Heading + intro */}
        <SectionHeading
          className="mt-10"
          size="hero"
          stacked
          title="Get in"
          highlight="Touch"
          highlightClassName="text-[#e2581e]"
          subtitle="Ready to experience the Viju Industries (Nigeria) Limited difference? We're here to answer your questions, discuss partnerships, and help you discover our premium product range."
        />

        {/* Metrics */}
        <div className="mt-12 grid w-full grid-cols-2 gap-6 sm:mt-14 lg:grid-cols-4">
          {contactStats.map((stat) => (
            <ContactStatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
