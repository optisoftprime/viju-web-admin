/**
 * Flyer Service
 * Handles all flyer-related API calls
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { Flyer, CreateFlyerRequest, UpdateFlyerRequest } from "@/lib/api/types";

/**
 * F-1: `description` is a real column now, so every request carries it
 * straight through.
 *
 * The retry-without-`description` path that used to guard these two calls -
 * against a body whitelist rejecting a property the route had not learned yet -
 * is gone. It could only ever drop the admin's copy silently, and there is
 * nothing left for it to protect against.
 *
 * On update the three cases are distinct server-side: omit the property to
 * leave the stored copy alone, send `""` (or whitespace) to clear it to null,
 * send text to replace it. Over 500 characters is a 400 from the validation
 * pipe.
 */
export const flyerService = {
  /**
   * Get all flyers
   */
  getFlyers: async (): Promise<Flyer[]> => {
    const response = await apiClient.get<Flyer[]>(endpoints.flyers.list);
    return response.data;
  },

  /**
   * Create a new flyer
   */
  createFlyer: async (flyer: CreateFlyerRequest): Promise<Flyer> => {
    const response = await apiClient.post<Flyer>(
      endpoints.flyers.create,
      flyer,
    );
    return response.data;
  },

  /**
   * Update an existing flyer
   */
  updateFlyer: async (id: string, flyer: UpdateFlyerRequest): Promise<Flyer> => {
    const url = endpoints.flyers.update.replace("{id}", id);
    const response = await apiClient.patch<Flyer>(url, flyer);
    return response.data;
  },

  /**
   * Delete a flyer
   */
  deleteFlyer: async (id: string): Promise<void> => {
    const url = endpoints.flyers.delete.replace("{id}", id);
    await apiClient.delete(url);
  },
};
