import React from "react";
import type { ContactStat } from "./contactData";

/**
 * Contact Stat Card
 * One tile from the metrics row under the hero heading.
 */
export default function ContactStatCard({
  icon: Icon,
  iconClassName,
  value,
  label,
}: ContactStat) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/6 bg-[#1c2637]/80 px-4 py-7 text-center backdrop-blur-sm">
      <Icon className={`h-7 w-7 ${iconClassName}`} strokeWidth={2} />

      <span className="text-2xl font-bold text-white sm:text-[1.75rem]">
        {value}
      </span>

      <span className="text-sm text-[#aab4c4]">{label}</span>
    </div>
  );
}
