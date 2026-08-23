# Backend Request — Sender Role, Per-Recipient Notifications & Flyer Details

**Raised by:** Frontend (Viju Customer Portal — Admin, Regional Admin, Account Officer & Loading Officer Web)
**Date:** 22 Aug 2026
**Feature specs:** `context/feature-spec/35-other-issues-fixes.md`, `context/feature-spec/36.product-flyer.md`
**Related:** `BACKEND_API_REQUESTS.md` (interaction audit), `documents/FRONTEND_GUIDE_INTERACTION_AUDIT.md`

> **ROUND 1 (S-1, N-1..N-4, F-1): CLOSED** — all six answered and integrated.
> See **§0 Resolution**.
>
> **ROUND 2 (C-1, P-1..P-5): CLOSED** — all six answered and integrated.
> See **§0b Resolution**.

Two of the three items in spec 35, and the single item in spec 36, could not be
finished on the frontend alone. All shipped behind a documented fallback, so
nothing was blocked — what is listed here is what would remove the fallback and
make the behaviour correct rather than approximated.

The **Example Response** column shows the body each endpoint should return, at
the shape the UI binds to, so a mismatch is visible before anything is built.
Full pretty-printed versions are in **§3**.

---

## 0. Resolution — round 1, all six answered

**Answered:** `documents/FRONTEND_GUIDE_SENDER_ROLE_AND_NOTIFICATIONS.md` (backend branch `dev`)
**Frontend integrated:** 22 Aug 2026

| # | Outcome | What changed on the frontend |
|---|---|---|
| **S-1** | **Done** on all six routes. `staff: { id, name, role }` on every staff-authored reply and message; `role` is the wire enum, no display text from the API. | Nothing to delete — `resolveSenderLabel()` was already written to prefer `staff.role`, so it started working on deploy. Added a shared `StaffSender` type and switched every call site to prefer `staff.id` over `staffId` for identity. |
| **N-1** | **Done.** Exactly one recipient per `CHAT_MESSAGE`; `staffId` is always the recipient, never the sender; a customer's feed is filtered on `staffId: null`. | The badge reads the server's `unread` again instead of recounting. `scopeNotifications()` kept as a belt-and-braces guard; it now reports `droppedByScope` instead of quietly shrinking the count. |
| **N-2** | **Already correct**, and tightened — deactivated regional admins are now skipped. | Audience map kept (the guide calls it harmless) with the rule spelled out in a comment. |
| **N-3** | **Confirmed** — the row was already written, now pinned by a test, and carries the waybill reference. | None needed. |
| **N-4** | **Confirmed** and pinned by a test. The outgoing officer is not notified at all, so there is no second type to map. | None needed; noted in the audience map so nobody adds one speculatively. |
| **F-1** | **Done.** Nullable `description` (max 500), on the list, create and update routes — and it reaches the distributor app's home carousel too. | The retry-without-`description` path and the "details were not kept" notice are **deleted**. `Flyer.description` is now required as `string \| null`. |

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| **§3.1** A distributor's chat message now notifies **one** officer, not every officer on the account. A secondary officer stops receiving `CHAT_MESSAGE` rows and the live frame for threads they are not part of. | No code change. Both officers still read the whole history and either can reply — only the notification narrowed. Worth telling the client, since it is a visible reduction for shared accounts. |
| **§3.2** A customer's bell filters on `staffId: null`. | No-op on existing data; the guard already separated the two feeds. |
| **§3.3** `WAYBILL_SUBMITTED` and `WAYBILL_ASSIGNED` bodies reworded. | No change — `NotificationItem` splits on the first `": "`, so it renders any `"<title>: <body>"` copy. |
| **§4** The release adds a database column and needs `prisma migrate deploy`. | Backend deploy step, not ours — flagged so it is not missed. |
## 0b. Resolution — round 2, all six answered

**Answered:** `documents/FRONTEND_GUIDE_UNREAD_COUNT_AND_DISTRIBUTOR_PUSH.md`
(backend branch `dev`)
**Frontend integrated:** 23 Aug 2026

| # | Outcome | What changed on the frontend |
|---|---|---|
| **C-1** | **Fixed — it was cause (b).** Nothing marked staff-side messages read, so `unReadMessage` could never fall; the count could only rise. `GET /chat/{customerId}` now marks the thread read for staff, and a new `PATCH /chat/{customerId}/read` was added. `unReadMessage` does count staff-unread. | The refetch fix we had already shipped now actually works — nothing was required. Added the new route through the API layer anyway (`endpoints.chat.markRead`, `chatService.markChatRead`, `useMarkChatRead`, `MarkChatReadResponse`) so it is typed and ready; it is deliberately **not** called anywhere yet, since fetching a thread already marks it read and neither of the guide's two use-cases exists in this portal today. |
| **P-1** | **Done.** Title is now `Loading update`; the status word is derived, never an enum. | Nothing — the item renders `content`. |
| **P-2** | **Done.** Title is now `Loading complete`; push `data` carries `reference` and `attachmentUrl`. | Nothing — the deep-link is the mobile app's. Our side already guarantees a document exists, since a load cannot be completed without one. |
| **P-3** | **Done.** Regional broadcast `content` is the admin's text verbatim; the `"Viju: "` prefix is gone. | **The one real change.** `NotificationItem` split every `content` on the first `": "`, so a prefix-less broadcast rendered as a lone bold heading, and one containing a colon — `"Note: depot closed"` — was torn in half with `"Note"` presented as a title the admin never wrote. See below. |
| **P-4** | **Done.** `content` is `"<name>: <message>"`; the old double prefix is gone. | Covered by the same `BROADCAST` special-case — the name prefix is part of the message, not a title. |
| **P-5** | **Done.** Amount read back from the credited `Payment`, formatted as currency, never rounded; ordering and failure guarantees all confirmed. | Nothing. `data.allowanceAmount` is available if a value is ever needed rather than the text. |

### The `NotificationItem` fix (P-3 / P-4)

`splitContent()` now takes the notification type and returns
`{ title: string | null; body: string }`:

- **`BROADCAST` is never split.** The text is the admin's own words.
- **No `": "` at all → a bare body, not a bare title.** Previously the whole
  string became the heading with an empty body, which reads as a truncated row.
- With no title, the body takes the weight the heading would have had, so a
  broadcast does not render as an orphaned subtitle.

Verified against every `content` string in the round-2 guide plus the
colon-in-a-broadcast trap and the round-1 strings, which are unaffected.

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| `unReadMessage` is **shared across staff**, not a per-viewer inbox — once any admin opens a thread the tile falls for all of them | Accepted and documented in `useChatHistory`. If "unread by *me*" is ever wanted it is a different feature and a different column, and the backend has offered to scope it. |
| Four notification `content` strings reworded | No change needed beyond the split fix — the item renders whatever it is given. |
| No migration in this release | Nothing to coordinate at deploy. |

---

## 1. Issue table (as raised)

| # | Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|---|
| **S-1** | A ticket reply and a chat message only carry `senderType: "STAFF" \| "CUSTOMER"`. There is no way to tell **which** member of staff wrote it, so every staff message renders as a flat **"Staff"** — an admin, a regional admin and the account officer who owns the account are indistinguishable in the thread. We need the sender's **role** (and name) on each staff message. | YES | YES | N/A — `GET /api/v1/tickets/{id}`, `POST /api/v1/tickets/{id}/replies`, `GET /api/v1/chat/{otherUserId}`, `POST /api/v1/chat/{receiverId}`, `GET /api/v1/admin/audit/tickets`, `GET /api/v1/admin/audit/chats` | The spec requires that "if the Admin or Regional Admin that reply a chat / send message to a ticket it should show on the message or chat card as `Admin` or `Regional Admin` not `Staff`". The reply row already stores `staffId`; please expand it into a nested `staff: { id, name, role }` on **every** staff-authored reply and message, on both the live routes and the two audit routes. `role` should be the wire enum (`ADMIN` \| `REGIONAL_ADMIN` \| `OFFICER` \| `LOADING_OFFICER`) — the frontend maps it to a label, so no display text is needed from the API. A customer-authored message needs no change. **The frontend already reads this field**: `resolveSenderLabel()` prefers `staff.role` whenever it is present, so the labels become correct for every sender the moment this ships, with no further frontend release. Until then the label is only correct for the reader's own messages (matched on `staffId`) and for the customer's assigned officer; every other staff sender falls back to their name, or to "Support Team". | **`GET /tickets/{id}`** → 200, `replies[]` entries gain `staff`:<br>`{ "id": "4b8e…", "ticketId": "9f1c…", "senderType": "STAFF", "staffId": "1a55…", "staff": { "id": "1a55…", "name": "Chidi Nwosu", "role": "REGIONAL_ADMIN" }, "content": "Escalated to finance.", "attachmentUrl": null, "createdAt": "2026-08-21T10:02:11.000Z" }`<br><br>**`GET /chat/{otherUserId}`** → 200, each staff message gains the same block:<br>`{ "id": "7d1a…", "customerId": "bd5d…", "staffId": "1a55…", "staff": { "id": "1a55…", "name": "Chidi Nwosu", "role": "ADMIN" }, "senderType": "STAFF", "content": "Looking into it now.", "attachmentUrl": null, "createdAt": "2026-08-21T10:04:00.000Z", "readAt": null }`<br><br>`GET /admin/audit/chats` → same block on each entry of `messages[]`. |
| **N-1** | **Chat notifications are not scoped to the officer who owns the conversation.** If account officer A is chatting with customer B, only officer A should be notified. Other account officers, the admin and the regional admins must not see that row at all. | YES | YES | N/A — `GET /api/v1/notifications/me` (the fan-out at write time is what changes) | `GET /notifications/me` reads "my notifications", so the scoping has to happen when the row is **created**, not when it is read — a row must be written **only** for the staff member it concerns, with `staffId` set to that person. Today the bell shows conversations the reader has no part in. Please confirm each `CHAT_MESSAGE` row is written for exactly one recipient — the officer assigned to that customer (or, when an admin/regional admin is the other party, that person) — and that `staffId` is always populated on a staff-bound row. **Frontend fallback in place:** `scopeNotifications()` drops any row whose `staffId` is not the signed-in user's, and any row that names a `customerId` with no `staffId` (a customer-feed row). That guard is defensive only — it cannot recover a row that was never addressed. | **`GET /notifications/me`** → 200<br>`{ "unread": 2, "data": [ { "id": "n1…", "customerId": "bd5d…", "staffId": "7c2a…", "content": "New message: ADLAK sent you a message", "isRead": false, "type": "CHAT_MESSAGE", "createdAt": "2026-08-22T09:10:00.000Z" } ], "meta": { "total": 2, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }`<br>`staffId` **must** be the recipient's id, never the sender's. |
| **N-2** | **A new loading request must notify only the regional admin of that region.** The admin and the account officers must not receive it. | YES | YES | N/A — fan-out on `POST` of a loading request; read via `GET /api/v1/notifications/me` | A loading request is raised against one region, and only that region's regional admin acts on it. Please write one `WAYBILL_SUBMITTED` row per regional admin **of the request's region**, with `staffId` set to that admin, and write none for `ADMIN` or `OFFICER`. If an organisation-wide admin is meant to see loading activity, please say so and we will treat it as a separate audience rather than inferring it. **Frontend fallback in place:** `WAYBILL_SUBMITTED` is mapped to the `REGIONAL_ADMIN` audience only, so the row is hidden from the other roles even if it is delivered to them. | **`GET /notifications/me`** → 200, one row per regional admin of the region<br>`{ "id": "n2…", "customerId": "bd5d…", "staffId": "3f9c…", "content": "New loading request: ADLAK raised a loading request in LAGOS", "isRead": false, "type": "WAYBILL_SUBMITTED", "createdAt": "2026-08-22T09:12:00.000Z" }` |
| **N-3** | **On assignment of a loading request, the assigned loading officer must be notified.** | YES | Please confirm | N/A — fan-out on `PATCH /api/v1/regional/loading-requests/{id}/assign` | The `WAYBILL_ASSIGNED` type already exists in the notification enum and the frontend renders it with a truck icon, but we have not been able to confirm the row is actually written when a regional admin assigns a load. Please confirm — or add — a single `WAYBILL_ASSIGNED` row addressed to the **assigned** loading officer, carrying enough text to identify the load (distributor and, ideally, the waybill or order reference). No row should go to anyone else. **Frontend fallback in place:** `WAYBILL_ASSIGNED` is mapped to the `LOADING_OFFICER` / `WAREHOUSE_OFFICER` audience. | **`GET /notifications/me`** → 200, for the assigned officer only<br>`{ "id": "n3…", "customerId": "bd5d…", "staffId": "5c7b…", "content": "Loading request assigned: ADLAK — WB-00231 is ready for loading", "isRead": false, "type": "WAYBILL_ASSIGNED", "createdAt": "2026-08-22T09:15:00.000Z" }` |
| **N-4** | **An account officer must receive `"[Customer Name] has been assigned to you"` when a customer is assigned to them.** Believed already live — asking for confirmation, not a change. | YES | N/A | N/A — fan-out on `PATCH /api/v1/admin/customers/{id}/reassign` | `BACKEND_API_REQUESTS.md` item **AD-R1** records that "the incoming officer is notified in-app **and** by web push on both paths" (first assignment and reassignment), and the live `content` format we render against is `"<title>: <body>"`, e.g. `"Customer assigned: Ade Foods Ltd has been assigned to you"`. Please confirm this is still the case and that the row is addressed to the **incoming** officer only — not to the outgoing officer, the admin, or the regional admin. If the outgoing officer is meant to be told they lost the account, that is a **separate** type and audience; please name it so we can map it rather than have it arrive as an `ASSIGNMENT` row on the wrong bell. **Frontend fallback in place:** `ASSIGNMENT` is mapped to the `OFFICER` audience only. | **`GET /notifications/me`** → 200, for the incoming officer only<br>`{ "id": "n4…", "customerId": "bd5d…", "staffId": "7c2a…", "content": "Customer assigned: Ade Foods Ltd has been assigned to you", "isRead": false, "type": "ASSIGNMENT", "createdAt": "2026-08-22T09:18:00.000Z" }` |
| **F-1** | **A product flyer has no field for its own copy.** `Flyer` carries only `name`, `imageUrl`, `sortOrder` and `isActive`, and `POST` / `PATCH /admin/product-flyers` accept only `name`, `imageUrl` and `isActive`. The flyer creation / edit form now has a **Flyer Details** text area, and there is nowhere to persist what is typed into it. | YES | YES | N/A — `GET /api/v1/admin/product-flyers`, `POST /api/v1/admin/product-flyers`, `PATCH /api/v1/admin/product-flyers/{id}` | Spec 36 asks for a details field on the flyer form. A flyer is a promotion, and the artwork alone cannot carry the offer's terms, dates or small print in text a distributor can read, copy or have read aloud — today that copy has to be baked into the image, which makes it unsearchable and unusable at small sizes. Please add a nullable free-text **`description`** column to the flyer record, return it on the list route, and accept it as an **optional** property on both the create and the update bodies. Suggested cap **500 characters**, which is what the form enforces. An empty string on `PATCH` should **clear** it; an omitted property should leave it unchanged. Existing flyers should read back `null`, not an error. **Frontend behaviour today:** the field is on the form, capped and trimmed, shown in the preview modal and clamped to two lines on the flyer card. It is sent as `description` on create (omitted when blank) and on update (sent as `""` to clear). Because we do not know whether these routes validate with a body whitelist, a `400` naming `description` is caught and the same request is **retried without the field**, so adding it can never break saving a flyer — the flyer saves, the copy is dropped, and the admin is told it was not kept. That retry is dead weight the moment the column ships and will be deleted then. | **`GET /admin/product-flyers`** → 200<br>`[ { "id": "f1…", "name": "December Bulk Offer", "imageUrl": "https://cdn…/flyer.jpg", "description": "Buy 50 cartons of Viju Milk between 1–31 December and get 5 free. Offer applies to Lagos and Western distributors only.", "sortOrder": 1, "isActive": true, "createdById": "1a55…", "createdAt": "2026-08-14T09:22:10.004Z", "updatedAt": "2026-08-22T09:40:00.000Z" } ]`<br><br>**`POST /admin/product-flyers`** → 201, body sent: `{ "name": "December Bulk Offer", "imageUrl": "https://cdn…/flyer.jpg", "description": "Buy 50 cartons…" }` — `description` omitted entirely when the admin left it blank. Response is the created `Flyer`, echoing `description` back.<br><br>**`PATCH /admin/product-flyers/{id}`** → 200, body sent: `{ "name": "…", "imageUrl": "…", "description": "" }` clears it; omitting the property leaves it unchanged. Response is the updated `Flyer`. |

---

## 1b. Issue table — round 2 (raised 23 Aug 2026)

From `context/feature-spec/38-other-issues.md`. **C-1** is a live bug on the
admin dashboard; **P-1..P-5** are the distributor push matrix the spec sets out,
none of which the web frontend can send.

| # | Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|---|
| **C-1** | **The admin's "Unread Messages" tile does not come down.** It reads `1` and keeps reading `1` after the admin has opened the conversation and read it. The number is what an admin acts on, so a stuck counter sends them back to a thread they have already answered. | YES | Please confirm | N/A — `GET /api/v1/chat/{customerId}`, `GET /api/v1/admin/dashboard` | We need to know **what marks a staff-side chat message read**. Two possibilities and we cannot tell them apart from here: (a) `GET /chat/{customerId}` already sets `readAt` on the customer's messages, in which case this is purely a caching problem and is now fixed on our side; or (b) nothing marks them read for staff, in which case `unReadMessage` can never fall and no amount of refetching helps. If (b), please either set `readAt` when a staff member fetches the thread, or add an explicit **`PATCH /api/v1/chat/{customerId}/read`** we can call when a conversation is opened. Please also confirm `unReadMessage` on `GET /admin/dashboard` counts **messages still unread by staff** rather than all inbound messages ever. **Frontend fix already shipped:** the tile's stale window was five minutes, so it was frozen regardless — it is now 30 seconds, refetches on focus and on revisiting the dashboard, and is invalidated the moment a chat thread is opened or replied to. That is everything the client can do; if `readAt` is never set, the count stays put. | **`GET /admin/dashboard`** → 200, after the admin has opened and read the only unread thread<br>`{ "totalCustomers": 1851, "totalActiveCustomers": 4, "customersWithoutOfficer": 3, "openTickets": 2, "unReadMessage": 0, "lastErpSyncAt": "2026-08-23T06:10:00.000Z" }`<br><br>If an explicit route is preferred: **`PATCH /chat/{customerId}/read`** → 200<br>`{ "customerId": "bd5d…", "markedRead": 3 }` |
| **P-1** | **Loading status change is not pushed to the distributor.** When a loading officer moves a request to `IN_PROGRESS` or `COMPLETED`, the distributor should get a push notification. | YES | YES | N/A — fan-out on `PATCH /api/v1/loading/queue/{id}/status` | Spec 38's push matrix, row 1: the distributor gets **`Your loading status is now: [status]`**. The `WAYBILL_STATUS_CHANGED` type already exists in the notification enum and the frontend already renders it with a truck icon, so nothing is needed from us — this is a fan-out on the customer's own feed (`staffId: null`, `customerId` = the distributor). Please confirm it fires on every forward move and carries the human-readable status, not the enum. | **`GET /notifications/me`** → 200, on the distributor's own feed<br>`{ "id": "p1…", "customerId": "bd5d…", "staffId": null, "content": "Loading update: Your loading status is now: Loading in Progress", "isRead": false, "type": "WAYBILL_STATUS_CHANGED", "createdAt": "2026-08-23T09:10:00.000Z" }` |
| **P-2** | **Loading completion / waybill issue is not pushed to the distributor.** | YES | YES | N/A — fan-out on `POST /api/v1/loading/queue/{id}/waybill` | Spec 38's push matrix, row 2: **`Your loading is complete. View your waybill in the app.`** This is the call that both records the document and completes the load, so it is the natural trigger. `WAYBILL_COMPLETED` already exists in the enum. Please include the waybill reference and the document URL on the push `data` payload so the app can deep-link straight to it rather than making the distributor hunt for it. Note the frontend now **requires** the document before a load can be completed, so there will always be one to link to. | **`GET /notifications/me`** → 200, on the distributor's own feed<br>`{ "id": "p2…", "customerId": "bd5d…", "staffId": null, "content": "Loading complete: Your loading is complete. View your waybill in the app.", "isRead": false, "type": "WAYBILL_COMPLETED", "createdAt": "2026-08-23T09:20:00.000Z" }`<br>Push `data`: `{ "waybillId": "wb1…", "reference": "WB-00231", "attachmentUrl": "https://cdn…/waybill.pdf" }` |
| **P-3** | **A regional broadcast is not pushed to the region's distributors.** | YES | Please confirm | N/A — fan-out on `POST /api/v1/admin/broadcasts/regional` | Spec 38's push matrix, row 3: every distributor in the named region(s) receives **the broadcast text verbatim**, with no prefix or decoration. The admin composes the exact words in the broadcast form, so anything we wrap around it would be copy the admin did not write and cannot see. `BROADCAST` already exists in the enum. Please confirm the fan-out covers every distributor in each selected region and that `content` is the message as typed. | **`GET /notifications/me`** → 200, on each in-region distributor's feed<br>`{ "id": "p3…", "customerId": "bd5d…", "staffId": null, "content": "Stock arrives Monday. Place orders before Friday 5pm.", "isRead": false, "type": "BROADCAST", "createdAt": "2026-08-23T09:30:00.000Z" }` |
| **P-4** | **An individual broadcast with no allowance is not pushed to the named distributor.** | YES | Please confirm | N/A — fan-out on `POST /api/v1/admin/broadcasts/individual` | Spec 38's push matrix, row 4: **`[Distributor name]: [message text]`**. Note this row is prefixed with the distributor's own name, unlike the regional row — that is the spec's wording and we have reproduced it verbatim rather than normalising it. Please confirm the exact format, since a distributor seeing their own name at the front of a message addressed to them may read oddly; if you would rather drop the prefix, say so and we will take it back to the client rather than the two of us diverging. | **`GET /notifications/me`** → 200, on the named distributor's feed<br>`{ "id": "p4…", "customerId": "bd5d…", "staffId": null, "content": "ADLAK: Your March invoice is ready for review.", "isRead": false, "type": "BROADCAST", "createdAt": "2026-08-23T09:35:00.000Z" }` |
| **P-5** | **An individual broadcast carrying a delivery allowance is not pushed with the credited amount.** | YES | YES | N/A — fan-out on `POST /api/v1/admin/broadcasts/individual` | Spec 38's push matrix, row 5: **`[Distributor name]: [message]. Delivery allowance of [amount] has been credited to your wallet.`** The amount must be **formatted as currency in the text** and must be the figure actually credited, read back from the allowance payment rather than echoed from the request — if the credit fails the distributor must not be told it succeeded. Please also confirm the ordering guarantee: the wallet credit lands **before** the push, so a distributor who opens the app on the notification sees the money already there. | **`GET /notifications/me`** → 200, on the named distributor's feed<br>`{ "id": "p5…", "customerId": "bd5d…", "staffId": null, "content": "ADLAK: Thanks for the bulk order. Delivery allowance of ₦1,500.50 has been credited to your wallet.", "isRead": false, "type": "BROADCAST", "createdAt": "2026-08-23T09:40:00.000Z" }`<br>Push `data`: `{ "allowanceAmount": 1500.5, "creditedAt": "2026-08-23T09:39:58.000Z" }` |

### Why P-1..P-5 cannot be done on the frontend at all

A push notification is sent by the server to a device the web app has no
handle on. This portal is where an admin **composes** a broadcast and where a
loading officer **changes** a status; the distributor who receives the push is
on a different application entirely. So every row above is a fan-out at write
time on a route we already call correctly — there is no client-side
approximation to ship, and nothing for us to hold as a fallback.

What the web app does own, and has done: the broadcast form sends the message
and the optional allowance, and the loading screen now refuses to complete a
load without the waybill document that P-2's notification points at.

**One request on amounts.** `₦1,500.50` in the P-5 example is deliberate: the
portal renders every money value to the API's precision and never rounds
(AO-D1). Please format the pushed amount from the credited figure with the same
fidelity, so the text a distributor reads and the balance they then see agree.

---

## 2. Why the frontend cannot close N-1..N-4 and F-1 on its own

`GET /notifications/me` is already a per-user read. Which rows exist for a user
is decided by the **fan-out at write time**, so a notification that was written
for the wrong audience is indistinguishable, at read time, from one that was
written correctly — both arrive as "mine".

The client-side guard that shipped with this change (`src/utils/notifications.ts`)
does two things and no more:

1. **Addressee check** — drop a row whose `staffId` names someone else, and a
   row that names a `customerId` with no `staffId` (a customer-feed row).
2. **Role-relevance check** — hide a type that cannot concern the reader's
   role, per the audience map in that file. An **unknown** type is always
   shown: the enum is closed but grows, and swallowing a new value silently is
   worse than showing it to one role too many.

Both are defensive. Neither can conjure a row for someone who was never
notified (N-3's risk), and the second is a blunt instrument — it works on
`type` alone, so it cannot separate two officers who both legitimately receive
`CHAT_MESSAGE` rows. Only `staffId` can do that, which is why N-1 asks for it
to be populated on every staff-bound row.

**One visible consequence:** because rows are filtered client-side, the bell
badge is now recounted from the rows the panel can actually show, rather than
using the server's `unread` total. If the server's fan-out is already correct
the two numbers are identical. If it is not, the badge is the honest one. The
server's figure is still returned to the caller as `serverUnread`.

### F-1 — flyer details

There is no client-side substitute at all here. A field with nowhere to be
stored is a field that loses what is typed into it the moment the page is
reloaded; browser-local storage would only make the loss less obvious, and
would not reach the distributor app, which is the whole point of the copy.

What did ship is the form field, the character cap, the preview and the card
rendering — everything except persistence — plus the retry described in the
table, so that introducing the field cannot break flyer creation if the route
rejects unknown properties. Until the column exists, an admin who writes
details and saves is told plainly that they were not kept.

---

## 3. Example responses in full

### S-1 — `GET /api/v1/tickets/{id}`

```json
{
  "id": "9f1c8a44-1c2e-4a90-9a11-3d5f6b7c8d90",
  "ticketId": "TCK-00123",
  "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
  "category": "BILLING",
  "subject": "Wallet not credited",
  "description": "I paid on Monday and my wallet is unchanged.",
  "attachmentUrl": null,
  "status": "IN_PROGRESS",
  "createdAt": "2026-08-20T09:14:02.000Z",
  "updatedAt": "2026-08-21T10:02:11.000Z",
  "customer": {
    "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "erpId": "10110003",
    "name": "ADLAK",
    "phone": "+2348168584112",
    "email": null,
    "region": "LAGOS",
    "assignedOfficerId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44"
  },
  "replies": [
    {
      "id": "4b8e1f22-0000-4000-8000-000000000001",
      "ticketId": "9f1c8a44-1c2e-4a90-9a11-3d5f6b7c8d90",
      "senderType": "STAFF",
      "staffId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
      "staff": {
        "id": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
        "name": "Ifeanyi Okon",
        "role": "OFFICER"
      },
      "content": "Checking with finance now.",
      "attachmentUrl": null,
      "createdAt": "2026-08-21T10:02:11.000Z"
    },
    {
      "id": "4b8e1f22-0000-4000-8000-000000000002",
      "ticketId": "9f1c8a44-1c2e-4a90-9a11-3d5f6b7c8d90",
      "senderType": "STAFF",
      "staffId": "1a55b0c9-4d3e-4f10-8b22-9c1d2e3f4a55",
      "staff": {
        "id": "1a55b0c9-4d3e-4f10-8b22-9c1d2e3f4a55",
        "name": "Chidi Nwosu",
        "role": "REGIONAL_ADMIN"
      },
      "content": "Escalated to finance — you will hear back today.",
      "attachmentUrl": null,
      "createdAt": "2026-08-21T11:40:00.000Z"
    }
  ]
}
```

The second reply is the whole point of S-1: today both render as "Staff", and
the distributor-facing thread cannot show that a regional admin stepped in.

### S-1 — `GET /api/v1/chat/{otherUserId}`

```json
[
  {
    "id": "7d1a0b33-0000-4000-8000-000000000001",
    "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "staffId": "1a55b0c9-4d3e-4f10-8b22-9c1d2e3f4a55",
    "staff": {
      "id": "1a55b0c9-4d3e-4f10-8b22-9c1d2e3f4a55",
      "name": "Chidi Nwosu",
      "role": "ADMIN"
    },
    "senderType": "STAFF",
    "content": "Looking into it now.",
    "attachmentUrl": null,
    "createdAt": "2026-08-21T10:04:00.000Z",
    "readAt": null
  },
  {
    "id": "7d1a0b33-0000-4000-8000-000000000002",
    "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "staffId": null,
    "staff": null,
    "senderType": "CUSTOMER",
    "content": "Thank you.",
    "attachmentUrl": null,
    "createdAt": "2026-08-21T10:06:00.000Z",
    "readAt": "2026-08-21T10:07:00.000Z"
  }
]
```

### N-1..N-4 — `GET /api/v1/notifications/me`

```json
{
  "unread": 3,
  "data": [
    {
      "id": "a1000000-0000-4000-8000-000000000001",
      "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "staffId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
      "content": "Customer assigned: Ade Foods Ltd has been assigned to you",
      "isRead": false,
      "type": "ASSIGNMENT",
      "createdAt": "2026-08-22T09:18:00.000Z"
    },
    {
      "id": "a1000000-0000-4000-8000-000000000002",
      "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "staffId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
      "content": "New message: ADLAK sent you a message",
      "isRead": false,
      "type": "CHAT_MESSAGE",
      "createdAt": "2026-08-22T09:10:00.000Z"
    },
    {
      "id": "a1000000-0000-4000-8000-000000000003",
      "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "staffId": "5c7b44aa-9e10-4c31-8f77-2b3c4d5e6f70",
      "content": "Loading request assigned: ADLAK — WB-00231 is ready for loading",
      "isRead": false,
      "type": "WAYBILL_ASSIGNED",
      "createdAt": "2026-08-22T09:15:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Every row carries a `staffId`, and it is always the **recipient** — that single
guarantee is what N-1 needs.

---

## 4. Summary of what we are asking for

| # | Ask | Blocking? |
|---|---|---|
| **S-1** | `staff: { id, name, role }` on every staff-authored ticket reply and chat message, on the live and audit routes | No — labels are approximated today |
| **N-1** | Every `CHAT_MESSAGE` row written for exactly one recipient, `staffId` always populated | No — guarded client-side |
| **N-2** | `WAYBILL_SUBMITTED` written only for the regional admins of the request's region | No — guarded client-side |
| **N-3** | Confirm (or add) `WAYBILL_ASSIGNED` for the assigned loading officer | **Yes** — a missing row cannot be recovered client-side |
| **N-4** | Confirm `ASSIGNMENT` goes to the incoming officer only; name the type if the outgoing officer is also told | No — believed already live |
| **F-1** | Nullable `description` on the flyer record; returned on the list route, optional on create and update | **Yes** — the form field has nowhere to save to |
