# Backend Request — Interaction Audit & Admin/Regional Admin Interconnection

**Raised by:** Frontend (Viju Customer Portal — Admin & Regional Admin Web)
**Date:** 22 Aug 2026
**Feature spec:** `context/feature-spec/32-update-interaction-audit.md`
**Related:** `BACKEND_REQUEST_CUSTOMER_LIST_PARITY.md` (customer projection)

> **STATUS: CLOSED — all nine items answered and integrated.** See
> **§0 Resolution** below for what shipped. The rest of the document is the
> original request, kept as the record of what was asked for and agreed.

Every item below was handled on the frontend at the time of asking — each
screen shipped with a documented fallback so nothing was blocked. What is
listed here is what would remove the fallback and make the screen behave the
way the spec describes.

The **Example Response** column shows the body each endpoint should return, as
the UI expects to consume it. Fields are given at the shape we bind to, so a
mismatch is visible before anything is built. Full, pretty-printed versions of
the same bodies are in **§3 Example responses in full**.

---

## 0. Resolution — all nine answered

**Answered:** `documents/FRONTEND_GUIDE_INTERACTION_AUDIT.md` (backend branch `dev`)
**Frontend integrated:** 22 Aug 2026

Every item below is closed. The table that follows is kept as the historical
record of what was asked and what shape was agreed; this section is what is
actually live.

| # | Outcome | What changed on the frontend |
|---|---|---|
| **AD-T1** | **Done.** `ADMIN` on every ticket, `REGIONAL_ADMIN` inside their own region. The `PATCH …/status` route had been authorising every caller as an `OFFICER`, so admin status changes really were 403ing. | Error branch now renders the API's own message. `POST …/replies` returns the **whole thread**, so the reply is written to cache and the refetch is gone. |
| **AD-C1** | **Done.** Both chat routes open to `ADMIN` and, region-scoped, `REGIONAL_ADMIN`. A staff message stores the **sender's own** `staffId`. | Read-only fallback removed — **the composer always shows**. The audit copy is now only the initial paint. |
| **AD-S1** | **Done.** `search` applies to both halves of the union; `meta.total` counts the filtered set. | Client-side page filter and its narrowing label deleted. |
| **AD-R1** | **Confirmed.** Unassigned customers work, the incoming officer is notified in-app **and** by push on both paths, and the response now carries `officerAssignments`. | Success message reads the officer back from the response. New **409 `ALREADY_ASSIGNED`** is treated as a no-op, not an error toast. |
| **RA-T1** | **Done.** `status` accepts a repeated or comma-separated list; `meta.total` counts the filtered set. | Client-side resolved-row filter and the "n rows hidden" line deleted; the screen asks for `OPEN,IN_PROGRESS,AWAITING_CUSTOMER`. |
| **RA-T2** | **Done.** `REGIONAL_ADMIN` on all four audit routes, token-derived and **overriding** any `region` sent. | Still sends no `region`. New **`REGION_NOT_SET` 403** surfaces as an account-configuration message. |
| **RA-C1** | **It was never authorised — now it is.** The 403 would have happened with or without `region`; our diagnosis was wrong, the fix was right. | Tab strip stays hidden, `region` still never sent, `REGION_NOT_SET` handled. |
| **RA-O1** | **Accepted and ignored — always 200**, never a 403. | Dropped `region` from the officers call anyway, so both region-scoped lists behave alike. |
| **AD-X1** | **Exists**, with exactly the columns requested, same filters as the list, `REGIONAL_ADMIN` allowed. | **Export button shipped** on the audit screen — exports whichever tab is showing — and on the regional Open Tickets page. |

### Breaking changes absorbed

| Change | Where it bit |
|---|---|
| `POST /tickets/{id}/replies` now returns the **`TicketThread` + a `reply` key** instead of the bare reply — so `response.id` is the **ticket** id | `SendTicketReplyResponse` added; the service, the mutation and `TicketThreadPanel` all read the thread from the response. **The officer web and the customer mobile app share this route and must be updated too.** |
| `PATCH /admin/customers/{id}/reassign` — new `409 ALREADY_ASSIGNED`, `message` reworded, `code` on every error | Handled as a no-op in `useReassignCustomer`; the screen's own pre-check now reports it the same way. |
| `GET /admin/audit/chats/export.csv` — new columns, filename `viju-audit-chats.csv` | First use, so nothing to migrate. |
| New `REGION_NOT_SET` 403 on every region-scoped route | Shared `isRegionNotSetError()` helper; handled on the audit screen, the regional tickets page and the customer table. |

---

## 1. Issue table (as raised)

| # | Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|---|
| **AD-T1** | An **ADMIN** must be able to open a ticket thread from the Interaction Audit "Ticket" tab, read it, reply and change its status — exactly as the assigned account officer does. The audit row only carries the ticket summary, so the screen calls `GET /tickets/{id}`, `POST /tickets/{id}/replies` and `PATCH /tickets/{id}/status`. Those three routes are documented for the **OFFICER** role. We need written confirmation that `ADMIN` is authorised on all three, or the authorisation added. | YES | YES | N/A — `GET /api/v1/tickets/{id}`, `POST /api/v1/tickets/{id}/replies`, `PATCH /api/v1/tickets/{id}/status` | The spec states "just as an account officer was able to access and reply to a ticket, an admin has authorization to do this". An admin is not the assigned officer for any customer, so any `assignedOfficerId === req.user.id` check on these routes will answer 403 for every ticket in the audit and the modal degrades to an error. Please allow `ADMIN` on all tickets and `REGIONAL_ADMIN` on tickets whose customer is in their own region (403 outside it), matching the scoping already applied to `GET /admin/audit/chats`. Response shapes must be unchanged from the officer flow — the same components render them. | **`GET /tickets/{id}`** → 200<br>`{ "id": "9f1c…", "ticketId": "TCK-00123", "customerId": "bd5d…", "category": "BILLING", "subject": "Wallet not credited", "description": "I paid on Monday…", "attachmentUrl": null, "status": "OPEN", "createdAt": "2026-08-20T09:14:02.000Z", "updatedAt": "2026-08-21T10:02:11.000Z", "customer": { "id": "bd5d…", "erpId": "10110003", "name": "ADLAK", "phone": "+2348168584112", "email": null, "region": "LAGOS", "assignedOfficerId": "7c2a…" }, "replies": [ { "id": "4b8e…", "ticketId": "9f1c…", "senderType": "STAFF", "staffId": "1a55…", "content": "Checking with finance now.", "attachmentUrl": null, "createdAt": "2026-08-21T10:02:11.000Z" } ] }`<br><br>**`POST /tickets/{id}/replies`** → 201, the **same TicketThread** with the new reply appended (the modal re-renders straight from it). Body sent: `{ "content": "…", "attachmentUrl": "https://…" }` — `attachmentUrl` omitted when there is none.<br><br>**`PATCH /tickets/{id}/status`** → 200<br>`{ "id": "9f1c…", "status": "IN_PROGRESS", "updatedAt": "2026-08-22T08:40:00.000Z" }` |
| **AD-C1** | An **ADMIN** must be able to open a chat thread from the Interaction Audit "Chat" tab and reply to the customer. The audit row carries at most the 200 most recent messages and is read-only, so the modal calls `GET /chat/{otherUserId}` for the live thread and `POST /chat/{receiverId}` to reply. Both are documented for the **OFFICER** role. | YES | YES | N/A — `GET /api/v1/chat/{otherUserId}`, `POST /api/v1/chat/{receiverId}` | The spec states "just as an account officer was able to access and reply to a chat, an admin has authorization to do this… and chat the customer". We need `ADMIN` authorised on both routes for any customer, and `REGIONAL_ADMIN` for customers in their own region. Please also confirm how a staff message sent by an admin is attributed — we expect `senderType: "STAFF"` with the **admin's own** `staffId`, so the audit trail shows who actually replied rather than crediting the assigned officer. **Until this is confirmed the modal falls back to the read-only audit copy and hides the composer**, so an admin can read but not reply. | **`GET /chat/{otherUserId}`** → 200, a **bare array**, oldest first<br>`[ { "id": "c1…", "customerId": "bd5d…", "staffId": "7c2a…", "senderType": "CUSTOMER", "content": "Has my waybill been assigned?", "attachmentUrl": null, "createdAt": "2026-08-21T08:12:00.000Z", "readAt": "2026-08-21T08:20:00.000Z" }, { "id": "c2…", "customerId": "bd5d…", "staffId": "1a55…", "senderType": "STAFF", "content": "Assigned this morning.", "attachmentUrl": "https://res.cloudinary…/chat-attachments/x.jpg", "createdAt": "2026-08-21T08:31:00.000Z", "readAt": null } ]`<br><br>**`POST /chat/{receiverId}`** → 201, the **single created message**<br>`{ "id": "c3…", "customerId": "bd5d…", "staffId": "1a55…", "senderType": "STAFF", "content": "Looking into it now.", "attachmentUrl": null, "createdAt": "2026-08-22T09:05:00.000Z", "readAt": null }`<br>`staffId` here must be the **replying admin's** id. |
| **AD-S1** | The **All Customers** modal search box does not narrow the list. It sends `search=` to `GET /admin/customers` together with `includeUnprojected=true`, and the response comes back containing rows that do not match the term. | YES | YES | N/A — `GET /api/v1/admin/customers?search=&includeUnprojected=true` | `search` is applied in default mode but appears to be dropped on the union (unprojected) path, which is the mode this modal uses so that `meta.total` matches the dashboard tile. Please apply `search` to **both** halves of the union — matching `name` and `erpId` on projected rows and the equivalent ERP-feed fields on unprojected ones — and make `meta.total` the size of the **filtered** union so paging stays arithmetically correct. **Interim:** the modal filters the page it already holds and labels the result, so the box works but only within the current page. | **`GET /admin/customers?search=latlek&includeUnprojected=true&page=1&pageSize=20`** → 200, every row matching, `meta` counting the **filtered** set<br>`{ "data": [ { "id": null, "erpId": "10110044", "name": "LATLEK VENTURES", "phone": "+2348011112222", "region": "LAGOS", "accountStatus": null, "outstandingBalance": null, "stockBalanceCartons": null, "hasOfficer": false, "officerAssignments": [], "_count": { "supportTickets": 0 }, "lastSyncedAt": "2026-08-19T04:30:05.124Z", "isProjected": false } ], "meta": { "total": 1, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false, "projectedTotal": 0, "unprojectedTotal": 1 } }`<br>Today the same request returns `meta.total: 1851` and unrelated rows. |
| **AD-R1** | Reassigning a customer who has **no** account officer yet. | YES | NO | N/A — `PATCH /api/v1/admin/customers/{id}/reassign` | Reported as "ADLAK has no account officer yet. Assign one from the Customers page." **This was a frontend defect and is fixed** — the screen was calling `PATCH /admin/officers/{id}/reassign-customers`, which moves a *source officer's* whole book and therefore has nothing to move for an unassigned customer. It now calls `PATCH /admin/customers/{id}/reassign`, which sets the assignment outright. **No backend change is requested.** Please only confirm that this endpoint (a) accepts a customer with an empty `officerAssignments[]`, and (b) fires the in-app notification **and** the web push to the incoming officer on assignment as well as on reassignment — the spec requires the officer to be notified in both cases. | **`PATCH /admin/customers/{id}/reassign`** → 200. Body sent: `{ "newOfficerId": "7c2a…" }`<br>`{ "message": "Customer assigned successfully" }`<br>Returning the updated assignment would let us refresh the OFFICERS cell without a refetch, which we would happily take:<br>`{ "message": "Customer assigned successfully", "customerId": "bd5d…", "officerAssignments": [ { "id": "as1…", "isPrimary": true, "assignedAt": "2026-08-22T09:10:00.000Z", "staff": { "id": "7c2a…", "name": "Ifeanyi Okon", "email": "i.okon@viju.com" } } ] }`<br>Errors we branch on: `404` unknown customer, `400` unknown/`inactive` officer, `409` officer already assigned. |
| **RA-T1** | The regional admin **Open Tickets** page needs *unresolved tickets only*. `GET /admin/audit/tickets` has no status filter, so the page fetches a page and drops the resolved rows in the browser — which makes the pagination counts disagree with what is on screen. | YES | YES | N/A — `GET /api/v1/admin/audit/tickets?status=` | Please add a `status` query parameter accepting the ticket status enum (`OPEN`, `IN_PROGRESS`, `AWAITING_CUSTOMER`, `RESOLVED`), repeatable or comma-separated so we can ask for "everything unresolved" in one request, with `meta.total` reflecting the filter. Unknown value → 400. Without it a page of 20 can show as few as 2 rows while the pager reports hundreds. **Interim:** the page filters client-side and states how many rows it hid. | **`GET /admin/audit/tickets?status=OPEN,IN_PROGRESS,AWAITING_CUSTOMER&page=1&pageSize=20`** → 200, envelope unchanged, only the filter and `meta` differ<br>`{ "data": [ { "id": "9f1c…", "ticketId": "TCK-00123", "customerId": "bd5d…", "category": "BILLING", "subject": "Wallet not credited", "description": "I paid on Monday…", "attachmentUrl": null, "status": "OPEN", "createdAt": "2026-08-20T09:14:02.000Z", "updatedAt": "2026-08-21T10:02:11.000Z", "customer": { "id": "bd5d…", "name": "ADLAK", "region": "LAGOS" }, "replies": [ { "id": "4b8e…", "ticketId": "9f1c…", "senderType": "STAFF", "staffId": "1a55…", "content": "Checking with finance now.", "attachmentUrl": null, "createdAt": "2026-08-21T10:02:11.000Z", "staff": { "id": "1a55…", "name": "Chinedu Okafor" } } ] } ], "meta": { "total": 37, "page": 1, "pageSize": 20, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false } }`<br>`meta.total: 37` = unresolved only, **not** the unfiltered count. Unknown status → `400 { "message": "status must be one of: OPEN, IN_PROGRESS, AWAITING_CUSTOMER, RESOLVED", "code": "VALIDATION_ERROR" }` |
| **RA-T2** | Is **REGIONAL_ADMIN** authorised on `GET /admin/audit/tickets`, scoped server-side to their own region? | YES | YES | N/A — `GET /api/v1/admin/audit/tickets` | `GET /admin/audit/chats` was opened to `REGIONAL_ADMIN` (B-4.2) with token-derived region scoping. The ticket audit is the only source of region-scoped tickets we have, and it is what the new `/regional-admin/tickets` page reads. Please apply the same rule: `REGIONAL_ADMIN` allowed, always scoped to their own region regardless of any `region` value sent, and never leaking another region's tickets. The frontend deliberately does **not** send `region` on this call. | **`GET /admin/audit/tickets?page=1&pageSize=20`** as a LAGOS regional admin → 200, identical shape to the admin response, but **every** `data[].customer.region` is `"LAGOS"` and `meta.total` counts that region only<br>`{ "data": [ { "id": "9f1c…", "ticketId": "TCK-00123", "subject": "Wallet not credited", "status": "OPEN", "createdAt": "2026-08-20T09:14:02.000Z", "updatedAt": "2026-08-21T10:02:11.000Z", "customer": { "id": "bd5d…", "name": "ADLAK", "region": "LAGOS" }, "replies": [] } ], "meta": { "total": 37, "page": 1, "pageSize": 20, "totalPages": 2, "hasNextPage": true, "hasPreviousPage": false } }`<br>Empty region → `{ "data": [], "meta": { "total": 0, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }` — never a `404`. |
| **RA-C1** | A **REGIONAL_ADMIN** could not view the customers in their region. | YES | NO | N/A — `GET /api/v1/admin/customers`, `GET /api/v1/admin/customers/{id}` | **This was a frontend defect and is fixed.** The shared customer table rendered the "All Regions / Lagos / …" tab strip for every role, and pressing any tab attached `?region=` — which your rule (`BACKEND_REQUIREMENTS_OUTSTANDING.md` B-1.1) correctly answers with a 403, since region scoping is token-derived. The tab strip is now hidden for a regional admin and `region` is never sent, so the endpoint returns their own region's customers. **No backend change is requested** — please only confirm `REGIONAL_ADMIN` remains authorised on this route with token-derived scoping, and that `GET /admin/customers/{id}` stays readable for a customer inside their region (B-3). | **`GET /admin/customers?page=1&pageSize=20`** as a LAGOS regional admin → 200, every row `"region": "LAGOS"`<br>`{ "data": [ { "id": "bd5d…", "name": "ADLAK", "erpId": "10110003", "phone": "+2348168584112", "region": "LAGOS", "accountStatus": "ACTIVE", "outstandingBalance": -10140600.1232, "stockBalanceCartons": 0, "hasOfficer": false, "assignedOfficerId": null, "officerAssignments": [], "_count": { "supportTickets": 0 }, "lastSyncedAt": "2026-08-16T23:01:03.287Z", "createdAt": "2026-08-13T14:06:51.169Z" } ], "meta": { "total": 412, "page": 1, "pageSize": 20, "totalPages": 21, "hasNextPage": true, "hasPreviousPage": false } }`<br>`outstandingBalance` is rendered **unrounded** — please keep sending full precision, not a 2-dp string.<br>Sending `?region=` as this role stays `403 { "message": "Region is derived from your account", "code": "REGION_NOT_ALLOWED" }` |
| **RA-O1** | Does `GET /admin/officers` accept a `region` value from a **REGIONAL_ADMIN**? | YES | Needs confirmation | N/A — `GET /api/v1/admin/officers?region=` | The regional admin Officers screen currently sends `region` taken from the signed-in user's own record. If this route follows the same token-derived rule as `GET /admin/customers`, that request is a 403 and the screen is empty. Please confirm which it is: if the parameter is rejected for the role we will stop sending it, exactly as we now do on the customer list. Flagged rather than changed because the screen is reported working today. | **`GET /admin/officers?page=1&pageSize=20`** → 200<br>`{ "data": [ { "id": "7c2a…", "name": "Ifeanyi Okon", "email": "i.okon@viju.com", "phone": "+2348012345678", "region": "LAGOS", "role": "OFFICER", "isActive": true, "lastLoginAt": null, "createdAt": "2026-01-12T08:00:00.000Z", "deactivatedAt": null, "reactivatedAt": null, "_count": { "customers": 24, "supportTickets": 3 } } ], "meta": { "total": 12, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }`<br>Whichever answer we get, we need it explicit: either the same 200 when `?region=LAGOS` is sent by that region's admin, or `403 { "message": "Region is derived from your account", "code": "REGION_NOT_ALLOWED" }` so we drop the parameter. |
| **AD-X1** | The Interaction Audit "Chat" tab has no CSV export. | Partially | NO | `GET /api/v1/admin/audit/chats/export.csv` | `GET /admin/audit/tickets/export.csv` exists and `endpoints.audits.chatsExport` is already wired to `/admin/audit/chats/export.csv` in the frontend, but we have no confirmation it is implemented. Please confirm it exists and accepts the same filters as `GET /admin/audit/chats` (`region`, `customerName`, `officerName`, `keyword`, `startDate`, `endDate`, `officerId`, `customerId`), so the export matches whatever the operator is looking at. One row per conversation, matching the table. | **`GET /admin/audit/chats/export.csv?region=LAGOS&startDate=2026-08-01`** → 200, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="viju-audit-chats.csv"`<br>`Customer,Customer Code,Account Officer,Region,Messages,Last Message`<br>`ADLAK,10110003,Ifeanyi Okon,LAGOS,24,2026-08-18T16:40:00.000Z`<br>`KJ Fresh Mart,10110044,Chinedu Okafor,LAGOS,3,2026-08-17T11:02:00.000Z`<br>Body is CSV, **not** a JSON envelope — we read it as a `Blob`. No matches → header row only, `200`, never `404`. |

---

## 2. Priority

| Priority | Items | Why |
|---|---|---|
| **High** | AD-T1, AD-C1 | Without these the admin can see interactions but cannot act on them, which is the entire point of the two audit tabs. AD-C1 is the harder stop: the chat composer is hidden until it is confirmed. |
| **High** | RA-T2 | If a regional admin is not authorised on the ticket audit, the new Open Tickets page has no data source at all. |
| **Medium** | RA-T1, AD-S1 | Both have working interim behaviour, but both make a page count disagree with its rows, which reads as a bug to an operator. |
| **Low** | AD-R1, RA-C1 | Already fixed on our side; listed for confirmation of the notification and authorisation behaviour only. |
| **Low** | RA-O1, AD-X1 | Confirmation and a nice-to-have export. |

---

## 3. Example responses in full

The same bodies as the table column, pretty-printed. Ids are shortened for
readability; the real values are UUIDs.

### 3.1 AD-T1 — `GET /api/v1/tickets/{id}` → `200`

```json
{
  "id": "9f1c2b40-1f4e-4c3a-9a11-0b6d2f7c8e51",
  "ticketId": "TCK-00123",
  "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
  "category": "BILLING",
  "subject": "Wallet not credited",
  "description": "I paid on Monday and the wallet still shows the old balance.",
  "attachmentUrl": null,
  "status": "OPEN",
  "createdAt": "2026-08-20T09:14:02.000Z",
  "updatedAt": "2026-08-21T10:02:11.000Z",
  "customer": {
    "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "erpId": "10110003",
    "name": "ADLAK",
    "phone": "+2348168584112",
    "email": null,
    "region": "LAGOS",
    "accountStatus": "ACTIVE",
    "outstandingBalance": -10140600.1232,
    "assignedOfficerId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44"
  },
  "replies": [
    {
      "id": "4b8e77a1-2d3c-4e5f-8a90-1b2c3d4e5f60",
      "ticketId": "9f1c2b40-1f4e-4c3a-9a11-0b6d2f7c8e51",
      "senderType": "STAFF",
      "staffId": "1a55c8e2-7b91-4d2f-8c34-5e6f7a8b9c01",
      "content": "Checking with finance now.",
      "attachmentUrl": null,
      "createdAt": "2026-08-21T10:02:11.000Z"
    }
  ]
}
```

`replies` is ordered oldest first. `description` is rendered as the opening
message of the thread, so it must always be present.

### 3.2 AD-T1 — `POST /api/v1/tickets/{id}/replies` → `201`

Request:

```json
{ "content": "Finance has credited the wallet.", "attachmentUrl": "https://res.cloudinary.com/viju/ticket-attachments/receipt.jpg" }
```

`attachmentUrl` is omitted entirely when there is no attachment. Response is
the **same `TicketThread` shape as §3.1** with the new reply appended — the
modal re-renders straight from it rather than refetching.

### 3.3 AD-T1 — `PATCH /api/v1/tickets/{id}/status` → `200`

Request:

```json
{ "status": "IN_PROGRESS" }
```

Response:

```json
{
  "id": "9f1c2b40-1f4e-4c3a-9a11-0b6d2f7c8e51",
  "status": "IN_PROGRESS",
  "updatedAt": "2026-08-22T08:40:00.000Z"
}
```

The select renders the ticket's own `status`, so a rejected change snaps back.
Unknown status → `400`.

### 3.4 AD-C1 — `GET /api/v1/chat/{otherUserId}` → `200`

A **bare array**, oldest first — not a `{ data, meta }` envelope.

```json
[
  {
    "id": "c1a2b3c4-0000-4000-8000-000000000001",
    "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "staffId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
    "senderType": "CUSTOMER",
    "content": "Has my waybill been assigned?",
    "attachmentUrl": null,
    "createdAt": "2026-08-21T08:12:00.000Z",
    "readAt": "2026-08-21T08:20:00.000Z"
  },
  {
    "id": "c1a2b3c4-0000-4000-8000-000000000002",
    "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
    "staffId": "1a55c8e2-7b91-4d2f-8c34-5e6f7a8b9c01",
    "senderType": "STAFF",
    "content": "Assigned this morning.",
    "attachmentUrl": "https://res.cloudinary.com/viju/chat-attachments/waybill.jpg",
    "createdAt": "2026-08-21T08:31:00.000Z",
    "readAt": null
  }
]
```

### 3.5 AD-C1 — `POST /api/v1/chat/{receiverId}` → `201`

Request:

```json
{ "content": "Looking into it now.", "attachmentUrl": null }
```

Response — the **single created message**:

```json
{
  "id": "c1a2b3c4-0000-4000-8000-000000000003",
  "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
  "staffId": "1a55c8e2-7b91-4d2f-8c34-5e6f7a8b9c01",
  "senderType": "STAFF",
  "content": "Looking into it now.",
  "attachmentUrl": null,
  "createdAt": "2026-08-22T09:05:00.000Z",
  "readAt": null
}
```

`staffId` must be the **replying admin's** id, not the assigned officer's —
that is what makes the audit trail show who actually answered.

### 3.6 AD-S1 — `GET /api/v1/admin/customers?search=latlek&includeUnprojected=true` → `200`

```json
{
  "data": [
    {
      "id": null,
      "erpId": "10110044",
      "name": "LATLEK VENTURES",
      "phone": "+2348011112222",
      "region": "LAGOS",
      "accountStatus": null,
      "outstandingBalance": null,
      "stockBalanceCartons": null,
      "hasOfficer": false,
      "officerAssignments": [],
      "_count": { "supportTickets": 0 },
      "lastSyncedAt": "2026-08-19T04:30:05.124Z",
      "isProjected": false
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "projectedTotal": 0,
    "unprojectedTotal": 1
  }
}
```

The point of the request: `meta.total` is **1**, the size of the filtered
union. Today the same call returns `1851` and rows that do not match.

### 3.7 AD-R1 — `PATCH /api/v1/admin/customers/{id}/reassign` → `200`

Request:

```json
{ "newOfficerId": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44" }
```

Current response, which is enough:

```json
{ "message": "Customer assigned successfully" }
```

Preferred response — lets the OFFICERS cell update without a refetch:

```json
{
  "message": "Customer assigned successfully",
  "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
  "officerAssignments": [
    {
      "id": "as1f2e3d-4c5b-6a79-8081-92a3b4c5d6e7",
      "isPrimary": true,
      "assignedAt": "2026-08-22T09:10:00.000Z",
      "staff": {
        "id": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
        "name": "Ifeanyi Okon",
        "email": "i.okon@viju.com"
      }
    }
  ]
}
```

Error bodies we branch on:

```json
{ "message": "Customer not found", "code": "CUSTOMER_NOT_FOUND" }
{ "message": "Officer not found or inactive", "code": "OFFICER_NOT_FOUND" }
{ "message": "Ifeanyi Okon is already assigned to this customer", "code": "ALREADY_ASSIGNED" }
```

### 3.8 RA-T1 / RA-T2 — `GET /api/v1/admin/audit/tickets?status=OPEN,IN_PROGRESS,AWAITING_CUSTOMER` → `200`

```json
{
  "data": [
    {
      "id": "9f1c2b40-1f4e-4c3a-9a11-0b6d2f7c8e51",
      "ticketId": "TCK-00123",
      "customerId": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "category": "BILLING",
      "subject": "Wallet not credited",
      "description": "I paid on Monday and the wallet still shows the old balance.",
      "attachmentUrl": null,
      "status": "OPEN",
      "createdAt": "2026-08-20T09:14:02.000Z",
      "updatedAt": "2026-08-21T10:02:11.000Z",
      "customer": {
        "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
        "name": "ADLAK",
        "region": "LAGOS"
      },
      "replies": [
        {
          "id": "4b8e77a1-2d3c-4e5f-8a90-1b2c3d4e5f60",
          "ticketId": "9f1c2b40-1f4e-4c3a-9a11-0b6d2f7c8e51",
          "senderType": "STAFF",
          "staffId": "1a55c8e2-7b91-4d2f-8c34-5e6f7a8b9c01",
          "content": "Checking with finance now.",
          "attachmentUrl": null,
          "createdAt": "2026-08-21T10:02:11.000Z",
          "staff": { "id": "1a55c8e2-7b91-4d2f-8c34-5e6f7a8b9c01", "name": "Chinedu Okafor" }
        }
      ]
    }
  ],
  "meta": {
    "total": 37,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Two things make this useful: `meta.total` counts the **filtered** set, and for
a `REGIONAL_ADMIN` every `customer.region` is their own region regardless of
what was sent. An empty region returns `data: []` with a valid `meta`, never a
`404`.

Rejected filter value:

```json
{ "message": "status must be one of: OPEN, IN_PROGRESS, AWAITING_CUSTOMER, RESOLVED", "code": "VALIDATION_ERROR" }
```

### 3.9 RA-C1 — `GET /api/v1/admin/customers` as a `REGIONAL_ADMIN` → `200`

```json
{
  "data": [
    {
      "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "name": "ADLAK",
      "erpId": "10110003",
      "phone": "+2348168584112",
      "region": "LAGOS",
      "accountStatus": "ACTIVE",
      "outstandingBalance": -10140600.1232,
      "stockBalanceCartons": 0,
      "hasOfficer": false,
      "assignedOfficerId": null,
      "officerAssignments": [],
      "_count": { "supportTickets": 0 },
      "lastSyncedAt": "2026-08-16T23:01:03.287Z",
      "createdAt": "2026-08-13T14:06:51.169Z"
    }
  ],
  "meta": {
    "total": 412,
    "page": 1,
    "pageSize": 20,
    "totalPages": 21,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Note `outstandingBalance: -10140600.1232`. The WALLET column now renders every
decimal the API sends rather than rounding to two — please keep returning the
full-precision number and not a pre-formatted 2-dp string.

Sending `?region=` as this role stays a `403`:

```json
{ "message": "Region is derived from your account", "code": "REGION_NOT_ALLOWED" }
```

### 3.10 RA-O1 — `GET /api/v1/admin/officers` → `200`

```json
{
  "data": [
    {
      "id": "7c2a09d3-6f61-49c2-9a0e-8d5b1f2c3a44",
      "name": "Ifeanyi Okon",
      "email": "i.okon@viju.com",
      "phone": "+2348012345678",
      "region": "LAGOS",
      "role": "OFFICER",
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2026-01-12T08:00:00.000Z",
      "deactivatedAt": null,
      "reactivatedAt": null,
      "_count": { "customers": 24, "supportTickets": 3 }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

What we need decided is the `?region=LAGOS` case for a LAGOS regional admin:
either this same `200`, or the `REGION_NOT_ALLOWED` `403` from §3.9 so we stop
sending the parameter.

### 3.11 AD-X1 — `GET /api/v1/admin/audit/chats/export.csv` → `200`

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="viju-audit-chats.csv"
```

```csv
Customer,Customer Code,Account Officer,Region,Messages,Last Message
ADLAK,10110003,Ifeanyi Okon,LAGOS,24,2026-08-18T16:40:00.000Z
KJ Fresh Mart,10110044,Chinedu Okafor,LAGOS,3,2026-08-17T11:02:00.000Z
```

One row per conversation, matching the Chat tab. Read as a `Blob`, so the body
must be CSV rather than a JSON envelope. No matches → the header row alone with
a `200`, never a `404`.

---

## 4. Interim behaviour while these were open (all now removed)

| Item | Interim frontend behaviour |
|---|---|
| AD-T1 | Ticket modal renders the API error branch if the routes refuse the admin; nothing crashes, and the row stays readable in the table. |
| AD-C1 | Chat modal falls back to the audit trail's own message list, hides the composer and says why. |
| AD-S1 | Search filters the current page and labels the narrowing, so the count under the table cannot be misread. |
| AD-R1 | Fixed — now calls `PATCH /admin/customers/{id}/reassign`, which works for an unassigned customer. |
| RA-T1 | Resolved tickets are filtered out client-side, with a line stating how many were hidden on that page. |
| RA-T2 | Error branch on the page, wording it as "could not be loaded for your account" rather than "no tickets". |
| RA-C1 | Region tabs hidden for a regional admin; `region` never sent; a line names the region being shown. |
| RA-O1 | Unchanged, pending your answer. |
| AD-X1 | No export button on the Chat tab until the route is confirmed. |
