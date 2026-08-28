"use client";

import { useMemo, useState } from "react";
import { MainLayout, Text } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import ArrowBack from "@/components/common/ArrowBack";
import ChatList from "@/components/chat/ChatList";
import type { ChatThreadSummary } from "@/components/chat/ChatListItem";
import ChatUI from "@/components/chat/ChatUI";
import { useOfficerChats } from "@/hooks/api/useChat";
import { safeText, safeNumber } from "@/utils/safe";
import { useQueryParam } from "@/hooks/useQueryParam";

/** Conversations fetched at a time; "Show more" grows the window */
const PAGE_SIZE = 30;

function ChatPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedThread, setSelectedThread] =
    useState<ChatThreadSummary | null>(null);

  // Lets the dashboard's Unread Messages tile deep-link straight to a thread
  const customerParam = useQueryParam("customer");

  /**
   * CH-3: `GET /officers/chats` returns CONVERSATIONS ONLY, already ordered by
   * recency across the whole portfolio and then paged.
   *
   * This replaced three workarounds in one go - fetching 100 accounts, dropping
   * the ones with no `lastMessageAt`, and re-sorting in the browser. None of
   * them survives, and the list is now complete for an officer of any size.
   *
   * "Show more" grows the page rather than accumulating pages: at conversation
   * -list scale one request for the whole visible window is simpler than
   * stitching pages together, and it cannot drift out of order.
   */
  const { data, isLoading, error } = useOfficerChats({
    page: 1,
    pageSize: visibleCount,
    search: searchTerm || undefined,
  });

  const threads: ChatThreadSummary[] = useMemo(
    () =>
      (data?.data ?? [])
        .map((row) => ({
          id: safeText(row.customerId, ""),
          name: safeText(row.name, "Unknown customer"),
          accountNumber: safeText(row.accountNumber, ""),
          lastMessageAt: row.lastMessageAt ?? null,
          unreadMessages: safeNumber(row.unreadMessages, 0),
          lastMessagePreview: row.lastMessagePreview ?? null,
          lastMessageSenderType: row.lastMessageSenderType ?? null,
          avatarUrl: row.avatarUrl ?? null,
        }))
        .filter((thread) => Boolean(thread.id)),
    [data?.data],
  );

  const totalThreads = data?.meta?.total ?? threads.length;
  const hasMore = threads.length < totalThreads;

  /** A new search starts from the first page again */
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setVisibleCount(PAGE_SIZE);
  };

  /**
   * The open conversation: whatever was clicked, else the one a deep link
   * named, else nothing. Derived rather than synced in an effect, so the
   * linked thread is already open on the first paint.
   */
  const activeThread =
    selectedThread ??
    (customerParam
      ? (threads.find((thread) => thread.id === customerParam) ?? null)
      : null);

  return (
    <MainLayout>
      <div className="px-4 pt-4 pb-4 h-screen flex flex-col bg-milkwhite/90">
        <ArrowBack />
        <PageHeader
          title="Chat"
          subtitle="Every conversation with the distributors on your accounts"
        />

        {/* The 30/70 split the spec asks for. It collapses to one column on a
            narrow screen, where a 30% pane would be unreadable. */}
        <div className="mt-4 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[30%_70%] gap-4 mb-20">
          <ChatList
            threads={threads}
            selectedId={activeThread?.id ?? null}
            onSelect={setSelectedThread}
            onSearch={handleSearch}
            isLoading={isLoading}
            isError={Boolean(error)}
            isSearching={Boolean(searchTerm.trim())}
            hasMore={hasMore}
            onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
          />

          {/* ChatUI scrolls its own transcript, so this wrapper must not
              scroll too - a second scroller would detach the composer from
              the bottom of the pane */}
          <div className="min-h-0">
            {activeThread ? (
              <ChatUI
                // Re-keyed per conversation so the composer, the staged
                // attachment and the scroll position never carry across from
                // the previous customer's thread
                key={activeThread.id}
                profileName={activeThread.name}
                profileStatus={activeThread.accountNumber || "Distributor"}
                distributorId={activeThread.id}
              />
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl border border-muted/20 bg-white p-6">
                <Text variant="caption" color="muted">
                  {threads.length > 0
                    ? "Select a chat to read the conversation."
                    : "No chat history found"}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

/**
 * Spec 41: the account officer's chat screen.
 *
 * Chat used to live behind a tab on a selected customer row on the dashboard,
 * which meant finding the customer before you could read what they had sent.
 * This inverts it - the conversations are the list, and the customer is what
 * you get when you open one.
 */
export default function ChatPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <ChatPageContent />
    </ProtectedRoute>
  );
}
