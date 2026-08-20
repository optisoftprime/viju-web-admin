/**
 * Realtime subscription (AO-10 / CC-03)
 *
 * The backend shipped SSE, not WebSocket. EventSource cannot send headers, so
 * the access token goes in the query string. Reconnection is handled by
 * EventSource itself; a frame is only a signal to refetch - all writes still
 * go through the existing REST routes.
 *
 * Mount this ONCE at app-shell level. The server only sends frames addressed
 * to the signed-in user, so no client-side filtering is needed.
 */

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Cookie from "js-cookie";
import { useAuthStore } from "@/store/auth.store";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/api/queryKeys";

type Frame = "chat.message" | "ticket.updated" | "notification.created";

const FRAMES: Frame[] = [
  "chat.message",
  "ticket.updated",
  "notification.created",
];

/** A frame body may be malformed or empty - never let JSON.parse escape */
const parseFrame = <T,>(raw: unknown): T | null => {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // EventSource is browser-only; bail out during SSR and when signed out
    if (typeof window === "undefined" || !isAuthenticated) return;

    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = Cookie.get("access_token");
    if (!baseURL || !token) return;

    let source: EventSource;
    try {
      const url = new URL(`${baseURL}${endpoints.realtime.stream}`);
      url.searchParams.set("token", token);
      url.searchParams.set("channels", "chat,tickets,notifications");
      source = new EventSource(url.toString());
    } catch {
      // A malformed base URL must not take the app down - realtime is an
      // enhancement, the 5-minute staleTime remains the fallback.
      return;
    }

    sourceRef.current = source;

    const handlers: Record<Frame, (event: MessageEvent) => void> = {
      "chat.message": (event) => {
        const message = parseFrame<{ senderId?: string }>(event.data);
        // Invalidate the specific thread when we can identify it, else all chat
        if (message?.senderId) {
          queryClient.invalidateQueries({
            queryKey: ["chatHistory", message.senderId],
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["chatHistory"] });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      },
      "ticket.updated": (event) => {
        const ticket = parseFrame<{ id?: string }>(event.data);
        queryClient.invalidateQueries({ queryKey: ["officerTickets"] });
        if (ticket?.id) {
          queryClient.invalidateQueries({ queryKey: ["ticketThread", ticket.id] });
        }
      },
      "notification.created": () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      },
    };

    FRAMES.forEach((frame) => {
      source.addEventListener(frame, handlers[frame] as EventListener);
    });

    // EventSource retries on its own; swallow the error so it is not noisy
    source.onerror = () => {};

    return () => {
      FRAMES.forEach((frame) => {
        source.removeEventListener(frame, handlers[frame] as EventListener);
      });
      source.close();
      sourceRef.current = null;
    };
  }, [isAuthenticated, queryClient]);
};

/**
 * Renderless component so the subscription can live in the provider tree.
 */
export default function RealtimeSubscriber() {
  useRealtime();
  return null;
}
