/**
 * Flyer Hooks - React Query
 * Reusable hooks for flyer operations
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flyerService } from "@/services/flyer.service";
import { queryKeys } from "@/lib/api/queryKeys";
import { CreateFlyerRequest, UpdateFlyerRequest } from "@/lib/api/types";

/**
 * Get all flyers
 */
export const useFlyers = () => {
  return useQuery({
    queryKey: queryKeys.flyers.list,
    queryFn: () => flyerService.getFlyers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Create a new flyer
 */
export const useCreateFlyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flyer: CreateFlyerRequest) => flyerService.createFlyer(flyer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flyers.all });
    },
  });
};

/**
 * Update an existing flyer
 */
export const useUpdateFlyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlyerRequest }) =>
      flyerService.updateFlyer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flyers.all });
    },
  });
};

/**
 * Delete a flyer
 */
export const useDeleteFlyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => flyerService.deleteFlyer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flyers.all });
    },
  });
};
