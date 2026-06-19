/**
 * Flyer Service
 * Handles all flyer-related API calls
 */

import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { Flyer, CreateFlyerRequest, UpdateFlyerRequest } from "@/lib/api/types";

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
  updateFlyer: async (
    id: string,
    flyer: UpdateFlyerRequest,
  ): Promise<Flyer> => {
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
