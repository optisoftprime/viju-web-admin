/**
 * Broadcast Service
 * Handles all broadcast-related API calls
 */

import { apiClient, endpoints } from "@/lib/api";
import { safeArray } from "@/utils/safe";
import {
  BroadcastRegionalRequest,
  BroadcastIndividualRequest,
  BroadcastIndividualBatchRequest,
  BroadcastHistoryFilters,
  BroadcastHistoryResponse,
  Broadcast,
  BroadcastDetail,
} from "@/lib/api/types";

/** B-2 - the server's own cap, mirrored so an oversized batch never leaves */
const MAX_BROADCAST_RECIPIENTS = 200;

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
   * Spec 39 (**B-2**): send the SAME individual broadcast to several customers
   * in ONE call.
   *
   * This used to fan out over the single-recipient route. The batch form now
   * exists and sends in sequence server-side, for the same reason the loop
   * did - each recipient can have a wallet credited.
   *
   * Answers ONE Broadcast ROW PER RECIPIENT, so history stays per-recipient.
   * The delivery allowance is credited PER RECIPIENT, not split between them -
   * twelve recipients at N1,000 credit N12,000 in total, which is what the
   * form states before anything is sent.
   *
   * Duplicates are collapsed server-side; the cap is 200 per call, enforced
   * here too so an oversized selection is refused with something readable.
   */
  sendIndividualBroadcastToMany: async (
    customerIds: string[],
    payload: Omit<BroadcastIndividualRequest, "customerId">,
  ): Promise<Broadcast[]> => {
    const unique = Array.from(new Set(customerIds));

    if (unique.length > MAX_BROADCAST_RECIPIENTS) {
      throw new Error(
        `Select at most ${MAX_BROADCAST_RECIPIENTS} customers at a time (${unique.length} selected).`,
      );
    }

    const body: BroadcastIndividualBatchRequest = {
      customerIds: unique,
      message: payload.message,
      ...(payload.deliveryAllowance !== undefined
        ? { deliveryAllowance: payload.deliveryAllowance }
        : {}),
    };

    const { data } = await apiClient.post(
      endpoints.broadcasts.sendIndividual,
      body,
    );

    // Tolerate the single-object shape too - the route still answers one
    // object for a single `customerId`, and a one-recipient batch coming back
    // unwrapped must not read as "nothing was sent"
    return Array.isArray(data) ? data : safeArray<Broadcast>([data]);
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
        // B-1 - server-side, across the whole history. Only sent when there
        // is something to search for; a blank value is an undeclared filter.
        ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
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
