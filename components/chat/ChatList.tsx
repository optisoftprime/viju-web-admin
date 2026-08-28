"use client";

import { Text } from "@/components/common";
import SearchInput from "@/components/common/SearchInput";
import ChatListItem, { type ChatThreadSummary } from "./ChatListItem";

interface ChatListProps {
  threads: ChatThreadSummary[];
  selectedId: string | null;
  onSelect: (thread: ChatThreadSummary) => void;
  onSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  /** True while a search term is active, so the empty state can say which */
  isSearching: boolean;
  /** More conversations exist beyond the ones loaded */
  hasMore: boolean;
  onShowMore: () => void;
}

/**
 * Spec 41: the account officer's conversation list - the 30% column.
 *
 * Only customers the officer has actually exchanged messages with appear here.
 * It is a CHAT HISTORY, not a customer list: a distributor who has never
 * written has no conversation to open, and padding the column with every
 * account would bury the ones that do.
 *
 * That is the SERVER's guarantee as of CH-3 - `GET /officers/chats` returns
 * conversations only, already ordered by recency across the whole portfolio.
 * Nothing is filtered or re-sorted here.
 */
export default function ChatList({
  threads,
  selectedId,
  onSelect,
  onSearch,
  isLoading,
  isError,
  isSearching,
  hasMore,
  onShowMore,
}: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-white border border-muted/20 rounded-xl overflow-hidden">
      <div className="px-3 py-3 border-b border-muted/20 space-y-2">
        <Text variant="body" weight="bold" color="foreground">
          Chats
        </Text>
        {/* An officer can hold dozens of accounts; a conversation list with no
            way to find one is a list you scroll rather than use */}
        <SearchInput
          placeholder="Search customer"
          onSearch={onSearch}
          debounceDelay={400}
          fullWidth
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-center">
            <Text variant="caption" color="muted">
              Loading chats...
            </Text>
          </div>
        )}

        {!isLoading && isError && (
          <div className="p-4 text-center">
            <Text variant="caption" color="muted">
              Could not load your chats. Please try again.
            </Text>
          </div>
        )}

        {!isLoading && !isError && threads.length === 0 && (
          <div className="p-6 text-center">
            <Text variant="caption" color="muted">
              {isSearching
                ? "No chat matches that search"
                : "No chat history found"}
            </Text>
          </div>
        )}

        {!isLoading &&
          !isError &&
          threads.map((thread) => (
            <ChatListItem
              key={thread.id}
              thread={thread}
              isSelected={selectedId === thread.id}
              onClick={() => onSelect(thread)}
            />
          ))}

        {!isLoading && !isError && hasMore && (
          <button
            type="button"
            onClick={onShowMore}
            className="w-full py-3 text-[12px] font-medium text-primary hover:bg-muted/5 transition-colors"
          >
            Show older conversations
          </button>
        )}
      </div>
    </div>
  );
}
