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

/**
 * Resolve a loose region string onto the API enum.
 *
 * The admin dashboard's `byRegion[].region.name` is a display label ("Lagos",
 * "South-South") while every filter must send the enum ("LAGOS",
 * "SOUTH_SOUTH"). Matching on both, case- and separator-insensitively, means a
 * card can deep-link into a filtered table without the two vocabularies having
 * to agree. Anything unrecognised returns undefined, which reads as "no filter"
 * rather than sending a value the API answers 400 for.
 */
export const resolveRegion = (
  input?: string | null,
): BroadcastRegion | undefined => {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return undefined;

  // "South-South", "south south" and "SOUTH_SOUTH" all collapse to the same key
  const normalize = (value: string) =>
    value.toUpperCase().replace(/[\s-]+/g, "_");

  const key = normalize(raw);
  return REGIONS.find(
    (region) =>
      normalize(region.value) === key || normalize(region.label) === key,
  )?.value;
};
