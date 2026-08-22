# Backend Request — Sender Role, Per-Recipient Notifications & Flyer Details

**Raised by:** Frontend (Viju Customer Portal — Admin, Regional Admin, Account Officer & Loading Officer Web)
**Date:** 22 Aug 2026
**Feature specs:** `context/feature-spec/35-other-issues-fixes.md`, `context/feature-spec/36.product-flyer.md`
**Related:** `BACKEND_API_REQUESTS.md` (interaction audit), `documents/FRONTEND_GUIDE_INTERACTION_AUDIT.md`

> **STATUS: CLOSED — all six items answered and integrated.** See
> **§0 Resolution** below for what shipped. The rest of the document is the
> original request, kept as the record of what was asked for and agreed.

Two of the three items in spec 35, and the single item in spec 36, could not be
finished on the frontend alone. All shipped behind a documented fallback, so
nothing was blocked — what is listed here is what would remove the fallback and
make the behaviour correct rather than approximated.

The **Example Response** column shows the body each endpoint should return, at
the shape the UI binds to, so a mismatch is visible before anything is built.
Full pretty-printed versions are in **§3**.

---

## 0. Resolution — all six answered

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
