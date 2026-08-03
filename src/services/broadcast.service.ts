/**
 * Broadcast Service
 * Handles all broadcast-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import {
  BroadcastRegionalRequest,
  BroadcastIndividualRequest,
  BroadcastHistoryFilters,
  BroadcastHistoryResponse,
  Broadcast,
  BroadcastDetail,
} from "@/lib/api/types";

export const broadcastService = {
  /**
   * Send regional broadcast
   * Responds 201 with the created broadcast record
   */
  sendRegionalBroadcast: async (
    payload: BroadcastRegionalRequest,
  ): Promise<Broadcast> => {
    const { data } = await apiClient.post(
      endpoints.broadcasts.sendRegional,
      payload,
    );
    return data;
  },

  /**
   * Send individual broadcast
   * Responds 201 with the created broadcast record
   */
  sendIndividualBroadcast: async (
    payload: BroadcastIndividualRequest,
  ): Promise<Broadcast> => {
    const { data } = await apiClient.post(
      endpoints.broadcasts.sendIndividual,
      payload,
    );
    return data;
  },

  /**
   * Fetch broadcast history with filters
   * Responds with { data, meta }, newest first
   */
  getBroadcastHistory: async (
    filters: BroadcastHistoryFilters,
  ): Promise<BroadcastHistoryResponse> => {
    const { data } = await apiClient.get(endpoints.broadcasts.history, {
      params: {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 20,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.region ? { region: filters.region } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      },
    });
    return data;
  },

  /**
   * Get broadcast detail by ID
   */
  getBroadcastDetail: async (id: string): Promise<BroadcastDetail> => {
    const { data } = await apiClient.get(
      `${endpoints.broadcasts.detail}/${id}`,
    );
    return data;
  },
};
