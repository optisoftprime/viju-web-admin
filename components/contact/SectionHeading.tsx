import React from "react";

type HeadingSize = "hero" | "section";

interface SectionHeadingProps {
  /** Leading words, rendered in white */
  title: string;
  /** Trailing words, rendered in the accent colour */
  highlight: string;
  /** Accent colour class for the highlighted words */
  highlightClassName?: string;
  subtitle?: string;
  /**
   * "hero" is the oversized stacked heading at the top of the page,
   * "section" is the smaller heading used above each section below it.
   */
  size?: HeadingSize;
  /** Puts the highlight on its own line - the hero stacks, sections wrap */
  stacked?: boolean;
  className?: string;
}

const titleSizeMap: Record<HeadingSize, string> = {
  hero: "text-[3.25rem] leading-[1.05] sm:text-7xl lg:text-[7.5rem] lg:leading-[0.95]",
  section: "text-3xl leading-tight sm:text-4xl lg:text-5xl",
};

const subtitleSizeMap: Record<HeadingSize, string> = {
  hero: "mt-7 max-w-[54rem] text-base sm:text-lg lg:text-xl leading-relaxed",
  section: "mt-4 max-w-3xl text-sm sm:text-base leading-relaxed",
};

/**
 * Section Heading
 * The white-then-accent serif heading shared by all three sections of the
 * contact page.
 */
export default function SectionHeading({
  title,
  highlight,
  highlightClassName = "text-[#ef3b47]",
  subtitle,
  size = "section",
  stacked = false,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <h2
        className={`font-display font-bold tracking-tight text-white ${titleSizeMap[size]}`}
      >
        {title}
        {stacked ? <br /> : " "}
        <span className={highlightClassName}>{highlight}</span>
      </h2>

      {subtitle && (
        <p className={`text-[#c3cad6] ${subtitleSizeMap[size]}`}>{subtitle}</p>
      )}
    </div>
  );
}
