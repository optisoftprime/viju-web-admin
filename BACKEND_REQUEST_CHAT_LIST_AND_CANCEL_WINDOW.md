# Backend Request — The Officer's Chat List & the Cancellation Window

**Raised by:** Frontend (Viju Customer Portal — Account Officer, Regional Admin & Loading Officer Web)
**Date:** 28 Aug 2026
**Feature spec:** `context/feature-spec/41-many-corrections03.md`
**Related:** `BACKEND_REQUEST_REGION_EDITING_AND_LOADING_FLOW.md` (L-1), `documents/FRONTEND_GUIDE_ACCOUNT_OFFICER.md` (AO-C1)

> **STATUS: CLOSED — all four answered and integrated, §4 confirmed.**
> See **§0a Resolution**.
>
> *(Original status: OPEN.)*
>
> Spec 41 has three items. Two are done on the frontend with nothing needed
> from you — the loading officer's sidebar badge, and the narrowed cancellation
> window, which is **enforced in the UI today**.
>
> The four asks below are: **one rule that only the client currently
> enforces** (LC-1), and **three gaps in the officer's conversation list**
> (CH-1..CH-3) that the new Chat screen works around rather than waits for.
> Nothing here is blocking. The screen ships and is usable; these are what make
> it correct rather than approximated.

The **Example Response** column shows the body each endpoint should return at
the shape the UI already binds to. Full pretty-printed versions are in **§3**.


---

## 0a. Resolution — all four answered, §4 confirmed

**Answered:** `documents/FRONTEND_GUIDE_CHAT_LIST_AND_CANCEL_WINDOW.md` (backend branch `dev`)
**Frontend integrated:** 28 Aug 2026
**No migration** — CH-2 reuses a column that already existed.

| # | Outcome | What changed on the frontend |
|---|---|---|
| **LC-1** | **Done.** `IN_PROGRESS → CANCELLED` is a 409 on all three routes, with the exact wording requested. Forward moves untouched. | Nothing behavioural — the button stays hidden, which is still the better experience. The "a rule only the client enforces is not enforced" comments are **deleted**: the API is the guarantee now, and the UI is the affordance. |
| **CH-1** | **Done.** `lastMessagePreview` + `lastMessageSenderType` on both list routes; 120 chars, ellipsis, whitespace collapsed, attachment-only labelled, text winning over the attachment label. | Rows show real previews, prefixed **"You: "** when the last word was staff's. The account code stays as the fallback for a thread with no preview — it was never only a stopgap. |
| **CH-2** | **Done, and better than the answer we expected.** The field already existed (`Customer.profilePhotoUrl`, set by distributors in the mobile app) and is populated. | Nothing — `ChatListItem` already read `avatarUrl`. `initialsOf` **stays** as the null case, which is most customers. |
| **CH-3** | **Done, as `GET /officers/chats`** — the option we preferred. Conversations only, ordered by recency across the whole portfolio, then paged. | **All three workarounds deleted** — see below. |
| **§4** | **Confirmed** against live data: neither list route marks anything read. Both are `groupBy`/`SELECT` only. | Nothing. Recorded so nobody adds a "mark read on list" convenience later. |

### The three workarounds CH-3 removed

`app/chat/page.tsx` is materially simpler:

| Was | Now |
|---|---|
| `PORTFOLIO_WINDOW = 100` — fetch 100 accounts and hope | Server pages the conversations; a "Show older conversations" control grows the window |
| Drop every row with a null `lastMessageAt` | The route never returns one |
| Re-sort by `lastMessageAt` in the browser | The server's order is correct **across the portfolio**, not within a page — which is the part the client-side sort could never have fixed |

The last one is worth spelling out: the client re-sort was defending against
NULLs sorting first, but the real defect was that ordering a *window of
accounts* is not the same as ordering *the portfolio*. Past 100 accounts the
list was silently incomplete, and no amount of browser-side sorting would have
caught it.

### CH-3(b) — the NULL ordering concern was wrong, usefully

`sortBy=lastMessageAt` was never a SQL `ORDER BY`: the field is derived after
the query, so the sort runs in memory through a comparator that already puts
`null` last **in both directions**. The concern was unfounded, and the answer
is now recorded here so it is not "fixed" again by someone reading the old
comment. `?hasMessages=true` was deliberately not added — `GET /officers/chats`
makes it redundant, and a second way to say "conversations only" is a second
thing to keep in step.

### One caveat accepted rather than escalated

`lastMessageSenderType: "STAFF"` means **any** staff member — an admin or
regional admin answering through the Interaction Audit writes a `STAFF` message
too — so **"You: " is the messaging-app convention here, not a claim of
authorship**. In the rare case where somebody else replied on the officer's
behalf it will read slightly wrong.

The backend offered to add the author's `staffId` to the row. We declined for
now: the consequence is cosmetic, it appears only on a fallback path, and
widening the payload of a list route for it is not a good trade. **Recorded in
`ChatListItem` rather than left to be rediscovered.** If an officer ever reports
it as confusing, the field is one line away on both sides.

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| Reading a thread (`GET /chat/{customerId}`) marks it read, which now also moves a badge in the conversation list | `useChatHistory` invalidates `["officerChats"]` alongside the dashboard tiles, so the badge clears with the tile rather than a refetch later |
| A sent reply becomes the thread's newest message | `useSendMessage` invalidates the list too, so the preview text and the ordering move with it |
| `GET /officers/customers` gained three fields and lost none | `OfficerCustomer` carries them as optional. Nothing reads them there today — the Chat screen uses the dedicated route — but they are typed, so the All Customers modal could show a preview without a service change |
| `avatarUrl` was NOT added to `GET /admin/customers` | Nothing needs it there. Left alone rather than asked for speculatively. |

---

## 0b. Summary as raised

*Kept as written, for the record. Every row is now **done** — see §0a.
"Frontend today" describes the workaround in place at the time of asking.*

| # | Item | Frontend at time of asking | Blocking? |
|---|---|---|---|
| **LC-1** | Refuse `CANCELLED` once a load is `IN_PROGRESS` | Button hidden; the API would still accept it | No — but the rule is unenforced |
| **CH-1** | `lastMessagePreview` on the officer customer list | Row shows the ERP account code instead of the message | No — the list works, it just isn't a preview |
| **CH-2** | A customer profile picture | Initials avatar drawn from the name | No |
| **CH-3** | A way to ask for "conversations only", correctly ordered | Fetches 100 accounts and narrows client-side | No — degrades past 100 accounts |

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **LC-1 — a load can still be cancelled after loading has started.** Spec 41 says a regional admin, an account officer and a loading officer must not cancel a request that is in progress or completed. `COMPLETED` is already a 409 (L-1). `IN_PROGRESS` is still accepted on all three routes. | YES | YES | N/A — tighten `PATCH /api/v1/regional/loading-requests/{id}/cancel`, `PATCH /api/v1/officers/loading-requests/{id}/cancel` and `PATCH /api/v1/loading/queue/{id}/status` | Please refuse `CANCELLED` from `IN_PROGRESS` with the same **409 `INVALID_STATUS_TRANSITION`** that `COMPLETED` already returns, so the legal window becomes `PENDING` and `ASSIGNED` only. The reason is not tidiness: cancelling a load that is already being loaded leaves stock physically moved with no waybill to account for it, and the portal has no way to reconcile that. **The frontend enforces this today by hiding the button** — but a rule only the client enforces is not enforced, and this one has a stock-integrity consequence. A message along the lines of "This load is already being loaded and can no longer be cancelled" would be rendered as-is. | `{ "message": "This load is already being loaded and cannot be cancelled.", "code": "INVALID_STATUS_TRANSITION", "statusCode": 409 }` |
| **CH-1 — the conversation list has no message to preview.** Spec 41 asks for a WhatsApp-style list: avatar, name, **last message**, time, unread count. `GET /officers/customers` (AO-C1) already gives us `unreadMessages` and `lastMessageAt` — everything except the message itself. | YES | YES | N/A — add `lastMessagePreview` to each row of `GET /api/v1/officers/customers` | A short excerpt of the most recent message on the thread, either side — say the first 120 characters, plain text, `null` on an empty thread. Ideally with `lastMessageSenderType` (`"CUSTOMER" \| "STAFF"`) so the row can prefix the officer's own last message with "You: ", which is what makes a messaging list readable at a glance. **Until this lands the row shows the ERP account code instead** — not a message, but true, and the thing that actually tells two similarly-named distributors apart. We would rather show something true than invent preview text. An attachment-only message should preview as something like `"📎 Attachment"` rather than an empty string. | `{ "lastMessagePreview": "Has my waybill been assigned?", "lastMessageSenderType": "CUSTOMER", "lastMessageAt": "2026-08-27T08:12:00.000Z", … }` |
| **CH-2 — customers have no profile picture.** The spec asks for a circular profile picture in each row. | NO | YES | N/A — add a nullable `avatarUrl` to the customer projection, surfaced on `GET /api/v1/officers/customers` (and ideally `GET /admin/customers`) | A nullable image URL on the customer record. If the ERP holds nothing suitable, the honest answer is "there is no such field" and we will keep drawing initials — please say so and we will close this rather than leave it open. If the distributor mobile app already lets a customer set an avatar, that is the value we want here. **The frontend draws an initials circle from the customer's name today**, which is a deliberate fallback rather than a placeholder to be replaced blindly: it should stay for any customer with no picture. | `{ "avatarUrl": "https://res.cloudinary…/avatars/adlak.jpg", … }` or `{ "avatarUrl": null, … }` |
| **CH-3 — no way to ask for "the conversations", and the ordering is not safe to trust.** The Chat screen needs the officer's threads ordered by recency across their **whole** portfolio, not one page of their customers. Two separate problems. **(a)** There is no filter for "has at least one message" — `overdue`, `activeTickets` and `unreadMessages` exist, but a thread that has been read is none of those. **(b)** `sortBy=lastMessageAt&sortOrder=desc` is accepted, but a customer who has never messaged has `lastMessageAt: null`, and SQL sorts NULLs **first** on a DESC ordering by default — which would float every never-messaged account to the top of a list ordered by recency. | YES | YES | Either add `?hasMessages=true` to `GET /api/v1/officers/customers` **and** confirm `NULLS LAST` on that sort — or add a purpose-built `GET /api/v1/officers/chats` | **Our preference is `GET /officers/chats`**, returning one row per conversation with only what a conversation list needs (see §3.1). It is a different resource from "my customers" and modelling it as one would let it carry CH-1 and CH-2 naturally, page correctly, and stop the screen paying for wallet balances and stock figures it never renders. The filter-plus-sort route is a fine second choice if that is cheaper. **Today the frontend fetches the first 100 accounts, drops the ones with no `lastMessageAt`, and re-sorts in the browser** — correct for a normal portfolio, and it silently stops being complete for an officer holding more than 100 accounts. Search is already server-side, so nobody is stranded in the meantime. | See §3.1 |

---

## 2. The workarounds, and what happened to each — RESOLVED

Written before the answers arrived, so the fallbacks would be easy to find and
delete. Kept with the outcome filled in.

| Behaviour | Where | Removed by | Outcome |
|---|---|---|---|
| Fetches 100 accounts and filters to those with `lastMessageAt` | `app/chat/page.tsx`, `PORTFOLIO_WINDOW` | **CH-3** | **Deleted** |
| Re-sorts by `lastMessageAt` in the browser rather than trusting the server order | same | **CH-3(b)** | **Deleted** |
| Renders the ERP account code as the row's secondary line | `components/chat/ChatListItem.tsx`, `preview` | **CH-1** | **Demoted to the fallback**, which is where it belonged — it is still what tells two same-named accounts apart |
| Draws an initials circle | same, `initialsOf` | **CH-2** | **Kept**, as intended — it is the null case for most customers, not a stopgap |
| Hides the cancel control once a load is `IN_PROGRESS` | `app/requests/loading/page.tsx`, `components/loadingOfficer/SelectedAssignement.tsx` | **LC-1** | **Kept.** The API is the guarantee now; hiding the control is still the better experience |

The prediction held: `ChatListItem` already read `lastMessagePreview` and
`avatarUrl`, so **CH-1 and CH-2 needed no change to the row at all** — only the
"You: " prefix, which is new information rather than a fallback being removed.

---

## 3. Example responses, pretty-printed

### 3.1 `GET /api/v1/officers/chats?page=1&pageSize=30&search=` (CH-3, preferred)

One row per conversation, most recent first, **conversations only** — a
customer the officer has never exchanged a message with does not appear.
`search` matches the customer name, account number and phone, exactly as it
does on `GET /officers/customers`.

```json
{
  "data": [
    {
      "customerId": "bd5d1f0e-3c44-4a91-8f22-71c0a9d6e455",
      "name": "ADLAK",
      "accountNumber": "10110003",
      "avatarUrl": null,
      "lastMessagePreview": "Has my waybill been assigned?",
      "lastMessageSenderType": "CUSTOMER",
      "lastMessageAt": "2026-08-27T08:12:00.000Z",
      "unreadMessages": 3
    },
    {
      "customerId": "7a1c9d22-88b0-4e13-9c60-2f5a4b7e8d90",
      "name": "ISEA INTEGRATED",
      "accountNumber": "10110017",
      "avatarUrl": "https://res.cloudinary…/avatars/isea.jpg",
      "lastMessagePreview": "Thanks, noted.",
      "lastMessageSenderType": "STAFF",
      "lastMessageAt": "2026-08-26T16:40:11.000Z",
      "unreadMessages": 0
    }
  ],
  "meta": { "page": 1, "pageSize": 30, "total": 12, "totalPages": 1 }
}
```

`unreadMessages` must mean the same thing it means on `GET /officers/customers`
(AO-C1): messages the **distributor** sent that are still unread, `0` rather
than omitted. The two numbers appearing on one screen and disagreeing would be
worse than either being absent.

### 3.2 `GET /api/v1/officers/customers` with CH-1 and CH-2 (the second choice)

Existing row, three fields added, nothing removed:

```json
{
  "id": "bd5d1f0e-3c44-4a91-8f22-71c0a9d6e455",
  "name": "ADLAK",
  "accountNumber": "10110003",
  "phone": "+2348168584112",
  "region": "LAGOS",
  "walletBalance": -10140600.1232,
  "stockBalanceCartons": 0,
  "accountStatus": "ACTIVE",
  "openTickets": 0,
  "unreadMessages": 3,
  "lastMessageAt": "2026-08-27T08:12:00.000Z",
  "lastMessagePreview": "Has my waybill been assigned?",
  "lastMessageSenderType": "CUSTOMER",
  "avatarUrl": null,
  "lastPurchaseDate": "2026-08-19T00:00:00.000Z",
  "lastContactDate": "2026-08-27T08:12:00.000Z"
}
```

With `?hasMessages=true`, only rows whose `lastMessageAt` is non-null are
returned, and `meta.total` counts that set.

---

## 4. One thing worth confirming either way — CONFIRMED

> Does listing conversations mark them read?

**No.** Verified against the live database: 8 unread before
`GET /officers/chats` and `GET /officers/customers`, 8 after. Both routes are
read-only by construction — `groupBy` and `SELECT` only, no `updateMany` on
either path. Only `GET /chat/{customerId}` marks a thread read (C-1), which is
right when a human opens a conversation.

This mattered because the unread count is **shared across staff**: a list that
quietly cleared it would clear it for everyone and destroy the only signal
telling an officer who is waiting. Nothing calls
`PATCH /chat/{customerId}/read` on our behalf; it remains available for the
"dismiss without opening" case, which this portal still does not have.
