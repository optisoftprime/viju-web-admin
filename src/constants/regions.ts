/**
 * Region Constants
 *
 * Single source of truth for Viju's operating regions. These values are the
 * live API enum - every filter, picker and form must send exactly these
 * strings. Add or rename a region here and every surface picks it up.
 */

import type { BroadcastRegion } from "@/lib/api/types";

export interface RegionOption {
  value: BroadcastRegion;
  label: string;
}

export const REGIONS: RegionOption[] = [
  { value: "LAGOS", label: "Lagos" },
  { value: "EASTERN", label: "Eastern" },
  { value: "SOUTH_SOUTH", label: "South-South" },
  { value: "WESTERN", label: "Western" },
  { value: "NORTH", label: "North" },
];

/**
 * The same list with an "All Regions" entry in front, for the filter tab
 * strips. An empty value means "no region filter".
 */
export const REGION_FILTER_TABS: { value: string; label: string }[] = [
  { value: "", label: "All Regions" },
  ...REGIONS,
];
