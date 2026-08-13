/**
 * Contact page content
 * Every repeated block on the page is driven from these arrays, so copy
 * changes never require touching the markup.
 */

import {
  Users,
  Globe,
  Clock,
  Zap,
  MapPin,
  Phone,
  Mail,
  type LucideIcon,
} from "lucide-react";

export interface ContactStat {
  icon: LucideIcon;
  /** Accent colour of the icon - alternates red/orange across the row */
  iconClassName: string;
  value: string;
  label: string;
}

export const contactStats: ContactStat[] = [
  {
    icon: Users,
    iconClassName: "text-[#ef4444]",
    value: "100K+",
    label: "Happy Customers",
  },
  {
    icon: Globe,
    iconClassName: "text-[#f26a1b]",
    value: "15+",
    label: "States Covered",
  },
  {
    icon: Clock,
    iconClassName: "text-[#ef4444]",
    value: "24/7",
    label: "Support Available",
  },
  {
    icon: Zap,
    iconClassName: "text-[#f26a1b]",
    value: "99%",
    label: "Response Rate",
  },
];

export interface ContactMethod {
  icon: LucideIcon;
  title: string;
  /** Primary line - the address, number or email itself */
  detail: string;
  /** Supporting line under the detail */
  note: string;
  /** Makes the primary line a tel:/mailto: link where that makes sense */
  href?: string;
}

export const contactMethods: ContactMethod[] = [
  {
    icon: MapPin,
    title: "Visit Our Office",
    detail: "1, Awose close Awosika Avenue",
    note: "Off Sapara Street, Off Oba Akran road, Ikeja Industrial Estate, Ikeja, Lagos.",
  },
  {
    icon: Phone,
    title: "Call Us Directly",
    detail: "+2348161674349",
    note: "+2348168108573",
    href: "tel:+2348161674349",
  },
  {
    icon: Mail,
    title: "Send Email",
    detail: "info@vijuindustries.com",
    note: "We respond within 24 hours",
    href: "mailto:info@vijuindustries.com",
  },
];
