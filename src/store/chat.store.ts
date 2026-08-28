/**
 * Chat UI state - Zustand
 *
 * Spec 42: which conversation the account officer is actually looking at.
 *
 * This exists for one reason: an unread badge must never count messages the
 * officer is reading right now. Opening a thread marks it read server-side
 * (C-1), but that is a round trip, and a message arriving *while* the thread
 * is open is read the moment it lands. Waiting for the refetch would flash a
 * badge for a message the officer can already see.
 *
 * So the open thread is held here - UI state, not server state, which is
 * exactly what the store layer is for - and both the sidebar total and the
 * conversation list subtract it.
 *
 * `unreadOnOpen` is the count the open thread was carrying, kept so the
 * sidebar total (which comes from the dashboard summary, not from the list)
 * can be corrected without refetching anything.
 */

import { create } from "zustand";

interface ChatUIStore {
  /** Customer id of the conversation on screen, or null when none is open */
  activeThreadId: string | null;
  /** Unread count attributed to that thread, so a total can net it out */
  activeThreadUnread: number;

  openThread: (threadId: string, unread: number) => void;
  /** Keep the netted-out figure in step as the list refreshes underneath */
  setActiveThreadUnread: (unread: number) => void;
  closeThread: () => void;
}

export const useChatUIStore = create<ChatUIStore>((set) => ({
  activeThreadId: null,
  activeThreadUnread: 0,

  openThread: (threadId, unread) =>
    set({ activeThreadId: threadId, activeThreadUnread: unread }),

  setActiveThreadUnread: (unread) => set({ activeThreadUnread: unread }),

  closeThread: () => set({ activeThreadId: null, activeThreadUnread: 0 }),
}));
