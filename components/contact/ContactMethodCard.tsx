import React from "react";
import type { ContactMethod } from "./contactData";

/**
 * Contact Method Card
 * One of the "Multiple Ways to Connect" cards - icon tile, title, primary
 * detail and a supporting note.
 */
export default function ContactMethodCard({
  icon: Icon,
  title,
  detail,
  note,
  href,
}: ContactMethod) {
  return (
    <div className="rounded-2xl border border-white/6 bg-[#1b2536] p-8">
      {/* Icon tile */}
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-[#f36c6c] to-[#e13b3b]">
        <Icon className="h-8 w-8 text-white" strokeWidth={2} />
      </span>

      <h3 className="mt-8 font-display text-2xl font-bold text-white">
        {title}
      </h3>

      {href ? (
        <a
          href={href}
          className="mt-4 block text-base font-bold text-white transition-colors hover:text-[#ef3b47]"
        >
          {detail}
        </a>
      ) : (
        <p className="mt-4 text-base font-bold text-white">{detail}</p>
      )}

      <p className="mt-3 text-sm font-bold leading-relaxed text-[#8e99a9]">
        {note}
      </p>
    </div>
  );
}
