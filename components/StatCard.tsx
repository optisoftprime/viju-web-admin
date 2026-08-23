import { Text } from "@/components/common";
import Image, { type StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";

/**
 * What a tile will accept as its icon: a Lucide component, or an imported
 * image asset (which Next turns into a StaticImageData object, not a string).
 */
type StatCardIcon = LucideIcon | StaticImageData | string;

/**
 * True for a React component rather than an image source.
 *
 * A Lucide icon is built with `forwardRef`, so it is an OBJECT with a
 * `$$typeof` marker - `typeof icon === "function"` is false for every one of
 * them. A static image import is also an object, but carries `src` and no
 * `$$typeof`, which is what separates the two.
 */
const isIconComponent = (icon: StatCardIcon): icon is LucideIcon =>
  typeof icon === "function" ||
  (typeof icon === "object" && icon !== null && "$$typeof" in icon);

interface StatCardProps {
  /**
   * Either an imported asset or a Lucide icon component.
   *
   * Every tile carries an icon that means something for that metric - tickets
   * get a ticket, messages get a message - so the grid can be scanned by shape
   * rather than read word by word.
   */
  icon: StatCardIcon;
  label: string;
  value: string | number;
  /**
   * Optional sub-line under the value, e.g. an ERP sync-freshness note.
   * Omitted entirely when not supplied, so existing cards are unchanged.
   */
  caption?: string | null;
  /**
   * Makes the whole card actionable. When supplied the card renders as a
   * button so it is reachable by keyboard and announced as clickable; without
   * it the card stays a plain div exactly as before.
   */
  onClick?: () => void;
  /**
   * Accessible description of what clicking does, e.g. "View all customers".
   *
   * NOT rendered - the tiles read as numbers, and a call-to-action line under
   * each one crowded the grid. It is still attached as the button's
   * `aria-label`, so a screen reader announces what the card does even though
   * nothing is printed.
   */
  actionLabel?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  caption,
  onClick,
  actionLabel,
}: StatCardProps) {
  const isClickable = typeof onClick === "function";

  /**
   * Render whichever kind of icon was passed, without the caller having to
   * say which it is.
   */
  const renderIcon = () => {
    if (!icon) return null;

    if (isIconComponent(icon)) {
      const IconComponent = icon;
      return (
        <IconComponent
          className="w-5 h-5 text-foreground shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      );
    }

    return (
      <Image
        src={icon}
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
        className="w-4 h-4"
      />
    );
  };

  const body = (
    <>
      <div className="flex items-center justify-between">
        <Text variant="caption" color="muted">
          {label}
        </Text>

        {renderIcon()}
      </div>
      <Text variant="h3" weight="bold" className="mt-3">
        {value}
      </Text>
      {caption ? (
        <Text variant="small" color="muted" className="mt-1 block">
          {caption}
        </Text>
      ) : null}
    </>
  );

  if (!isClickable) {
    return <div className="p-4 md:p-6 bg-white rounded-lg">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel ? `${label}. ${actionLabel}` : label}
      className="group p-4 md:p-6 bg-white rounded-lg text-left w-full cursor-pointer transition hover:shadow-md hover:ring-1 hover:ring-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {body}
    </button>
  );
}
