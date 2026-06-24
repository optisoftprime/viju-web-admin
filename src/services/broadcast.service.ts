/**
 * Broadcast Service
 * Handles all broadcast-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  BroadcastRegionalRequest,
  BroadcastIndividualRequest,
  BroadcastHistoryFilters,
  BroadcastHistoryItem,
  BroadcastDetail,
} from "@/lib/api/types";

export const broadcastService = {
  /**
   * Send regional broadcast
   */
  sendRegionalBroadcast: async (
    payload: BroadcastRegionalRequest,
  ): Promise<{ message: string; id: string }> => {
    try {
      const { data } = await apiClient.post(
        endpoints.broadcasts.sendRegional,
        payload,
      );
      return data;
    } catch (error) {
      console.log("Send regional broadcast failed:", error);
      throw error;
    }
  },

  /**
   * Send individual broadcast
   */
  sendIndividualBroadcast: async (
    payload: BroadcastIndividualRequest,
  ): Promise<{ message: string; id: string }> => {
    try {
      const { data } = await apiClient.post(
        endpoints.broadcasts.sendIndividual,
        payload,
      );
      return data;
    } catch (error) {
      console.log("Send individual broadcast failed:", error);
      throw error;
    }
  },

  /**
   * Fetch broadcast history with filters
   */
  getBroadcastHistory: async (
    filters: BroadcastHistoryFilters,
  ): Promise<{ items: BroadcastHistoryItem[]; total: number }> => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.region) params.append("region", filters.region);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.pageSize) params.append("pageSize", String(filters.pageSize));

      const { data } = await apiClient.get(
        `${endpoints.broadcasts.history}?${params.toString()}`,
      );
      return data;
    } catch (error) {
      console.log("Fetch broadcast history failed:", error);
      throw error;
    }
  },

  /**
   * Get broadcast detail by ID
   */
  getBroadcastDetail: async (id: string): Promise<BroadcastDetail> => {
    try {
      const { data } = await apiClient.get(
        `${endpoints.broadcasts.detail}/${id}`,
      );
      return data;
    } catch (error) {
      console.log("Fetch broadcast detail failed:", error);
      throw error;
    }
  },
};
