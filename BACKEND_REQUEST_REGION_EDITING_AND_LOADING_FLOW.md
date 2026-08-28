# Backend Request — Sixth Region, User Editing, Bulk Actions & the Loading Request Flow

**Raised by:** Frontend (Viju Customer Portal — Admin, Regional Admin, Account Officer & Loading Officer Web)
**Date:** 26 Aug 2026
**Feature spec:** `context/feature-spec/39-many-corrrections.md`
**Related:** `BACKEND_API_REQUESTS.md`, `BACKEND_API_REQUESTS_ACCOUNT_OFFICER.md`, `BACKEND_REQUEST_SENDER_ROLE_AND_NOTIFICATIONS.md`

> **STATUS: CLOSED — all eleven answered and integrated.** See **§0 Resolution**.
>
> *(Original status: OPEN. Every item was shipped on the frontend behind a
> documented fallback, so nothing in spec 39 was blocked. What is listed below
> is what would remove the fallback and make the behaviour correct rather than
> approximated — and, in the case of **R-1**, **A-1**, **L-1** and **L-2**,
> what the feature actually needed to work at all.)*

The **Example Response** column shows the body each endpoint should return at
the shape the UI already binds to, so a mismatch is visible before anything is
built. Full pretty-printed versions are in **§3**.

---

## 0. Resolution — all eleven answered

**Answered:** `documents/FRONTEND_GUIDE_REGION_EDITING_AND_LOADING_FLOW.md` (backend branch `dev`)
**Frontend integrated:** 26 Aug 2026

| # | Outcome | What changed on the frontend |
|---|---|---|
| **R-1** | **Done.** `OTHERS` is the sixth `Region` member, accepted everywhere the other five are, ordered last. | Nothing — it was already sent as a real value and started working on deploy. Added a comment recording that it is a **portal** region with no BP_CLUSTER_CODE: nothing the ERP sends can produce it, so `region=OTHERS` on the unprojected list correctly returns zero rows, and the unmapped-customers list will not shrink without somebody moving those rows. |
| **A-1** | **Done.** Three officer-scoped routes, same envelope and bodies as the regional ones, served by the same backend service methods. Scope is the officer's own portfolio — primary **or** secondary — with no `officerId` param. | Nothing — `loadingScopeForRole` started working. Recorded the primary-or-secondary rule on the endpoint, since it is what stops a reassignment hiding a load from the officer who now owns it. |
| **A-2** | **Done** via the first option offered: `OFFICER` authorised on `GET /admin/officers`, pinned to `role=LOADING_OFFICER` and their own region whatever the query says. | Nothing functional. Noted that sending `region` is harmless on every role — honoured for an ADMIN, ignored for the other two. |
| **L-1** | **Done.** Two `/cancel` routes plus `CANCELLED` on the status route, all taking the same optional `reason`. 409 on a COMPLETED load. | The loading officer's `window.confirm` is **replaced** by the same `CancelLoadingRequestModal` the other two roles get, so all three now name the load before cancelling and can record a reason. The modal's notice line is caller-specific: the officer's own cancellation notifies only the distributor. |
| **L-2** | **Done.** `description` on every loading row; its own PATCH route; assigned-officer-only; max 500; `""` clears it; answers the full detail. | Nothing — every one of those was already what the UI assumed. The `-` in the DESCRIPTION column stays: it renders a genuinely null note, not an unimplemented one. |
| **O-1** | **Done.** Profile fields accepted alongside `isActive`, same validation and failure shape as create, `REGION_NOT_ALLOWED` for an ADMIN, no email on a password change. | Nothing — the edit modal and the region pen icon started working. Its "nothing has changed" guard also keeps us off the new 400 `EMPTY_UPDATE`. |
| **O-2** | **Done.** `PATCH /admin/officers/bulk-region`, per-officer results, no transaction, max 500. | **The sequential fan-out is deleted.** One call now. `failed[]` entries carry `code`/`message` instead of a caught error, and the first failure's message is surfaced in the summary rather than just a count. |
| **C-2** | **Done.** `PATCH /admin/customers/bulk-reassign`, per-customer results, `ALREADY_ASSIGNED` counted as success. | **The 80-request fan-out is deleted.** One call now. The client-side `isAlreadyAssignedError` special-case went with it — the server does that classification on this route. The SINGLE route still answers 409, so `useReassignCustomer` keeps its own handling. |
| **B-1** | **Done.** `?search=` applied server-side across the whole history, matching reference, message and recipient name. | **The 200-row window and the client-side matcher are deleted.** Pagination is the server's in both modes and `meta.total` is the filtered size, so the silent failure at broadcast 201 is gone. |
| **B-2** | **Done.** `customerIds[]` accepted, answering one Broadcast row per recipient. Single `customerId` unchanged. Max 200. | **The loop is deleted.** One call now. The partial-failure handling went with it — this route is not partial, so a rejection means nothing was sent and the form simply keeps its values. |
| **C-1** | **Confirmed — both filters were already applied**, and the reassign region check is against the **customer's** region. | Nothing. The fix was right. Recorded both confirmations in the code, plus the caveat that a REGIONAL_ADMIN's `region` param is accepted and ignored. |

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| `PATCH /admin/officers/{id}` now takes an **empty body as a 400 `EMPTY_UPDATE`**, and applies a profile edit before an `isActive` change in a combined body | No-op. The edit modal refuses to send an empty body already, and never sends `isActive` — deactivation is a separate flow with its own 409 guards. |
| A **loading officer cancelling their own load notifies only the distributor**, unlike the other two roles | Copy change only — the confirmation now says "The distributor is notified immediately" on that screen and keeps the loading-officer wording on the other two. |
| `ALREADY_ASSIGNED` is a **success on the bulk route** and still a **409 on the single route** | Deliberately kept both. The bulk hook trusts the server's classification; `useReassignCustomer` keeps toasting it as an informational no-op, which is right when an operator acted on one customer. |
| Bulk routes are **not transactional** — a 2xx can carry failures | Both bulk hooks read `failed[]` on success rather than treating 2xx as "all done", and whatever failed stays selected for a retry. |
| Caps: **500** officers, **200** broadcast recipients per call | Mirrored client-side so an oversized selection is refused with a readable message instead of a 400. C-2 states no cap, so none is imposed. |
| `OTHERS` needs `prisma migrate deploy`, via a **type rebuild** rather than `ALTER TYPE ... ADD VALUE` (PostgreSQL 10.22 cannot run that in a transaction) | Backend deploy step, not ours. Already applied on dev; `docker-entrypoint.sh` runs it on container start. |

---

## 0b. Summary as raised — what was blocking, and what was only wasteful

*Kept as written, for the record. Every row is now **done** — see §0 above.
"Frontend today" describes the fallback that was in place at the time of
asking, not the code as it stands.*

| # | Item | Frontend at time of asking | Blocking? |
|---|---|---|---|
| **R-1** | `OTHERS` region added to the region enum | Sent as a real region value everywhere the other five are | **YES** — a 400 on every surface that names it |
| **A-1** | Account officer's loading-request routes | Calls `/officers/loading-requests*`; 404 until it exists | **YES** — the new sidebar entry is dead without it |
| **A-2** | Account officer may read `GET /admin/officers?role=LOADING_OFFICER` | Assign picker calls it; a 403 renders as "could not load officers" | **YES** for the assign step |
| **L-1** | `CANCELLED` as a status target and a cancel route | Cancel buttons call routes that do not exist yet | **YES** |
| **L-2** | `description` on a loading request, plus a route to set it | Column renders `-`; the officer's Save fails | **YES** |
| **O-1** | `PATCH /admin/officers/{id}` accepting name / phone / region / password | Edit modal and the region pen icon both send it | **YES** |
| **O-2** | Bulk officer region route | Fans out over **O-1**, one request per officer | No — slow, not broken |
| **C-2** | Bulk customer reassignment route | Fans out over the single reassign route | No — slow, not broken |
| **B-1** | `search` on broadcast history | Fetches a 200-row window and matches in the browser | No — degrades past 200 |
| **B-2** | Multi-recipient individual broadcast | One request per recipient | No — slow, not broken |
| **C-1** | Region + `isActive` filters honoured on `GET /admin/officers` | Already sent; if ignored, the "not found or inactive" bug returns | **YES if not already supported** |

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **R-1 — `OTHERS` is not in the region enum.** Spec 39 adds a sixth region. The frontend now offers it in every region filter, every region tab strip, the create-user form, the edit-user form, the officer region picker and the broadcast region multi-select. | YES (the enum exists) | YES | N/A — widen the existing `Region` enum used by `/admin/customers`, `/admin/officers`, `/admin/broadcasts/regional`, `/regional/*` and `/officers/*` | Add `OTHERS` as a sixth member of the region enum, accepted anywhere the other five are: as a `?region=` filter, as `region` on user creation and update, and inside `targetRegions` on a regional broadcast. It is the catch-all for a customer whose ERP `BP_CLUSTER_CODE` maps to none of the five named territories — which is also what would let `GET /admin/erp/unmapped-customers` shrink, since those rows currently have nowhere to go. **A migration is needed:** this is a Prisma enum, so `prisma migrate deploy` is part of the release. | `{ "id": "…", "name": "Acme Ltd", "region": "OTHERS", … }` |
| **A-1 — an account officer cannot receive or act on loading requests.** Spec 39 makes the account officer a peer of the regional admin on this flow, with their own `Loading Request` sidebar entry. There is no officer-scoped equivalent of `/regional/loading-requests`. | NO | N/A | `GET /api/v1/officers/loading-requests`, `PATCH /api/v1/officers/loading-requests/{id}/assign`, `PATCH /api/v1/officers/loading-requests/{id}/cancel` | Three routes mirroring the regional ones exactly — same query params (`page`, `pageSize`, `search`, `status`), same row shape, same `meta`, same request bodies. **Only the scope differs:** a regional admin sees their whole region; an account officer should see the loading requests of the customers assigned to them, resolved from their own staff record, never from a query param. The frontend already picks the path from the signed-in role (`loadingScopeForRole`), so nothing else changes on our side when these land. | Identical envelope to `GET /regional/loading-requests` — see §3.1 |
| **A-2 — an account officer needs to read the loading-officer list.** The assign modal is populated from `GET /admin/officers?role=LOADING_OFFICER&isActive=true&region=…`, which is an admin/regional-admin route today. | YES | YES | N/A — widen the authorisation on `GET /admin/officers` | Allow `OFFICER` to call this route **when it is filtered to `role=LOADING_OFFICER`**, scoped to their own region. They cannot assign a load without seeing who to assign it to, and this is the list the regional admin already uses. If widening `/admin/officers` is unattractive, a narrow `GET /api/v1/officers/loading-officers` returning the same rows is equally good. | Same as `GET /admin/officers` — see §3.2 |
| **L-1 — a loading request cannot be cancelled.** `PATCH /loading/queue/{id}/status` accepts `IN_PROGRESS` and `COMPLETED` only, and no route calls a load off. Spec 39 gives all three roles a cancel action. | PARTIAL | YES | `PATCH /api/v1/regional/loading-requests/{id}/cancel`, `PATCH /api/v1/officers/loading-requests/{id}/cancel`, plus `CANCELLED` accepted on `PATCH /api/v1/loading/queue/{id}/status` | Two things. **(a)** The regional admin and the account officer cancel via the `/cancel` routes, body `{ "reason"?: string }` — optional, and omitted entirely rather than sent blank when the operator gives none. **(b)** The loading officer cancels their own load through the status route they already use, by sending `{ "status": "CANCELLED" }`. Legal from `PENDING`, `ASSIGNED` and `IN_PROGRESS`; a `COMPLETED` load is final and should answer **409**, which is what the UI expects (the button is hidden for those rows, but the API is the control). The distributor and the assigned loading officer should be notified, as they are on assignment. | `{ "id": "…", "status": "CANCELLED", "cancelledAt": "2026-08-26T14:02:11.000Z", "cancelReason": "distributor rescheduled", … }` |
| **L-2 — a loading request carries no description.** Spec 39 adds a `DESCRIPTION` column to the loading request table and an input on the loading officer's screen: *"customer loading 800 cartons on 26/08/2026, remaining a balance of 200 cartons"*. | NO | YES | `PATCH /api/v1/loading/queue/{id}/description` + a nullable `description` on every loading-request row | A nullable `description` (max 500) on the loading request, returned by `GET /loading/queue`, `GET /loading/queue/{id}`, `GET /regional/loading-requests` and the new `/officers/loading-requests`. Writable by the **assigned loading officer only**, body `{ "description": string }`. Deliberately its own route rather than a field on the status route: the note is written and corrected independently of the status, so saving one must never move the other. An empty string is a valid save — it clears a note that turned out to be wrong, which is better than leaving a wrong one in place. | `{ "id": "…", "description": "customer loading 800 cartons on 26/08/2026, remaining a balance of 200 cartons", … }` |
| **O-1 — a user's details cannot be edited.** `PATCH /admin/officers/{id}` takes `{ isActive }` and nothing else. Spec 39 asks for an admin to edit Full Name, Region, Phone Number and Password from `/admin/users`, and to change an account officer's region from the officer profile modal. | YES | YES | N/A — widen the body on `PATCH /admin/officers/{id}` | Accept `{ name?, phone?, region?, password? }` on the existing route, every field optional, and apply only what is present. The frontend sends **only what changed** — an unchanged password is never resubmitted, since that would rotate a credential nobody asked to rotate. Validation should match `POST /admin/officers` (name 2–120, phone the same pattern, password 8–72) and report failures the same way, via `field` + `message`, so they land on the right input rather than in a toast. `region` on an `ADMIN` should stay a **400 REGION_NOT_ALLOWED** — the UI does not offer it for that role, but the API is the control. A password change should **not** email the new credential; the admin passes it on. | `{ "id": "…", "name": "Ada Obi", "phone": "+2348012345678", "region": "OTHERS", "role": "OFFICER", "isActive": true, "changed": true }` |
| **O-2 — no bulk officer region route.** Spec 39 adds checkbox selection to `/admin/officers` and a "Reassign Region" action over the selection. | NO | N/A | `PATCH /api/v1/admin/officers/bulk-region` | Body `{ "officerIds": string[], "region": Region }`. Not required — the frontend fans out over **O-1**, sequentially so a large selection is not a burst of parallel writes — but that is N round trips for what is one intent, and a partial failure is then N partial states rather than one reported outcome. If it is added, please return per-officer results rather than failing the whole batch: moving nine officers and failing the tenth must not undo the nine. | `{ "succeeded": ["…"], "failed": [{ "officerId": "…", "code": "…", "message": "…" }] }` |
| **C-1 — does `GET /admin/officers` honour `region` and `isActive`?** This is the root of the reported bug: assigning a customer to an officer answered **"Officer not found or inactive"**. The picker was listing every officer in the organisation, most of whom were invalid for that customer. | YES | Confirm | N/A | The frontend now sends `?isActive=true&region=<the customer's own region>` on the assign pickers (single and bulk, account officers and loading officers), so only valid candidates are offered. **Please confirm both filters are applied on this route.** If either is ignored, the picker silently goes back to listing officers the reassign route will reject, and the original bug returns unchanged. Also worth confirming: is `region` on `PATCH /admin/customers/{id}/reassign` compared against the **customer's** region or the **officer's**? The error message does not say, and the UI is now built on the assumption that the two must match. | `{ "data": [{ "id": "…", "name": "…", "role": "OFFICER", "region": "LAGOS", "isActive": true, … }], "meta": { … } }` |
| **C-2 — no bulk customer reassignment route.** Spec 39 adds checkbox selection to `/admin/distributors` and an "Assign Account Officer" action over the selection. | NO | N/A | `PATCH /api/v1/admin/customers/bulk-reassign` | Body `{ "customerIds": string[], "newOfficerId": string }`. Same shape of request as **O-2** and the same reasoning: the frontend fans out over `PATCH /admin/customers/{id}/reassign` sequentially, so it works, but an admin assigning 80 customers makes 80 requests. Per-customer results please, not all-or-nothing. Note a **409 ALREADY_ASSIGNED** should count as a success in a batch — the customer ends up holding exactly the officer that was asked for, which is the point of the call. | `{ "succeeded": ["…"], "failed": [{ "customerId": "…", "code": "…", "message": "…" }] }` |
| **B-1 — broadcast history cannot be searched.** `GET /admin/broadcasts/history` takes `type`, `region`, `startDate`, `endDate`, `page` and `pageSize`. Spec 39 adds a search bar. | YES | YES | N/A — add `?search=` to `GET /admin/broadcasts/history` | Match on `reference`, `message`, and the recipient — the target customer's name for an individual broadcast. This portal does not send params the API has not declared (an unknown one is a 400, not a no-op), so until it exists the frontend fetches the **200 most recent** broadcasts in one window and matches them in the browser. That is a real search for now and silently stops being one at 201 broadcasts, which is why this is worth doing even though it is not blocking. | Same envelope as today, filtered — see §3.3 |
| **B-2 — an individual broadcast goes to exactly one customer.** Spec 39 asks for multiple recipients on one send. | YES | YES | N/A — accept `customerIds: string[]` on `POST /admin/broadcasts/individual` | Accept `{ "customerIds": string[], "message": string, "deliveryAllowance"?: number }` alongside the current single-`customerId` form. The frontend loops today, sequentially, because each call can credit a wallet and a burst of parallel payment writes is not something this route has been asked to take. **Please confirm the allowance semantics either way:** the UI states, before anything is sent, that an allowance is credited **per recipient** and not split between them. If a batch form is added and would divide it instead, that is a different feature and we need to say so in the form. | `{ "id": "…", "type": "INDIVIDUAL", "deliveredCount": 12, … }` |

---

## 2. Status vocabulary — one clarification

Spec 39 lists the loading statuses as
`ASSIGNED | LOADING_IN_PROGRESS | COMPLETED | CANCELLED`.

The **wire value in use today is `IN_PROGRESS`**, not `LOADING_IN_PROGRESS`, on
both `/loading/*` and `/regional/loading-requests`. `LOADING_IN_PROGRESS`
belongs to a *different* enum — `CustomerWaybillStatus`, returned by
`/officers/customers/{id}/waybills` — and the two are deliberately not shared.

The frontend has kept `IN_PROGRESS` and reads the spec's spelling as the
display label, which is what the UI already renders ("Loading In Progress").
**No change is wanted here** — this is recorded so nobody reconciles the two
enums by renaming one of them. `PENDING` also remains, unmentioned by the spec
but real: it is the state before a loading officer is assigned.

---

## 3. Example responses, pretty-printed

### 3.1 `GET /api/v1/officers/loading-requests` (A-1)

Identical to `GET /regional/loading-requests`, plus `description` from **L-2**
and the two cancellation stamps from **L-1**.

```json
{
  "data": [
    {
      "id": "8f2c1e64-1a77-4c0b-9f2e-2b1d4a5c6d7e",
      "waybill": "WB-004212",
      "reference": "ORD-0099",
      "distributorName": "Alfuji Faruk Shola",
      "orderId": "3c9a77b2-55d1-4e2a-9f01-0c2b3d4e5f60",
      "truckPlateNumber": "LAG-234-XY",
      "driverName": "John Dare",
      "driverPhone": "+2348012345678",
      "quantityCartons": 320,
      "loadingDate": "2026-08-26T09:00:00.000Z",
      "submittedAt": "2026-08-25T16:41:02.000Z",
      "region": "LAGOS",
      "status": "ASSIGNED",
      "assignedOfficer": { "id": "…", "name": "Musa Bello" },
      "description": null,
      "cancelledAt": null,
      "cancelReason": null
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 37, "totalPages": 2 }
}
```

### 3.2 `GET /api/v1/admin/officers?role=LOADING_OFFICER&isActive=true&region=LAGOS` (A-2 / C-1)

```json
{
  "data": [
    {
      "id": "1b2c3d4e-5f60-4718-9a2b-3c4d5e6f7081",
      "name": "Musa Bello",
      "email": "musa.bello@viju.ng",
      "phone": "+2348011122233",
      "role": "LOADING_OFFICER",
      "region": "LAGOS",
      "isActive": true,
      "lastLoginAt": "2026-08-26T07:15:44.000Z",
      "_count": { "customers": 0, "supportTickets": 0 }
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "total": 4, "totalPages": 1 }
}
```

### 3.3 `GET /api/v1/admin/broadcasts/history?search=depot&page=1&pageSize=10` (B-1)

```json
{
  "data": [
    {
      "id": "aa11bb22-cc33-4d44-8e55-6f7788990011",
      "reference": "BC-000318",
      "type": "REGIONAL",
      "message": "Note: the Ikeja depot closes at 4pm on Friday.",
      "targetRegions": ["LAGOS", "OTHERS"],
      "targetCustomerId": null,
      "targetCustomer": null,
      "deliveryAllowance": null,
      "allowancePaymentId": null,
      "sentById": "…",
      "sentBy": { "name": "Ada Obi", "email": "ada.obi@viju.ng" },
      "sentAt": "2026-08-26T10:02:00.000Z",
      "deliveredCount": 412,
      "createdAt": "2026-08-26T10:02:00.000Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

### 3.4 `PATCH /api/v1/loading/queue/{id}/description` (L-2)

Request:

```json
{ "description": "customer loading 800 cartons on 26/08/2026, remaining a balance of 200 cartons" }
```

Response — the full assignment detail, so the screen re-renders from one body:

```json
{
  "id": "8f2c1e64-1a77-4c0b-9f2e-2b1d4a5c6d7e",
  "waybill": "WB-004212",
  "orderId": "ORD-0099",
  "distributorName": "Alfuji Faruk Shola",
  "truckPlateNumber": "LAG-234-XY",
  "driverName": "John Dare",
  "quantityCartons": 320,
  "loadingDate": "2026-08-26T09:00:00.000Z",
  "submittedAt": "2026-08-25T16:41:02.000Z",
  "region": "LAGOS",
  "status": "IN_PROGRESS",
  "description": "customer loading 800 cartons on 26/08/2026, remaining a balance of 200 cartons",
  "attachmentUrl": null,
  "updatedAt": "2026-08-26T11:20:31.000Z"
}
```

### 3.5 `PATCH /api/v1/admin/officers/{id}` with a profile body (O-1)

Request — only what changed:

```json
{ "name": "Ada Obi", "region": "OTHERS" }
```

Response:

```json
{
  "id": "1b2c3d4e-5f60-4718-9a2b-3c4d5e6f7081",
  "name": "Ada Obi",
  "email": "ada.obi@viju.ng",
  "phone": "+2348012345678",
  "region": "OTHERS",
  "role": "OFFICER",
  "isActive": true,
  "changed": true
}
```

---

## 4. Deploy note

**R-1** widens a Prisma enum, so the release needs `prisma migrate deploy`.
**L-1** and **L-2** add a column and an enum member respectively and need the
same. Flagged here so it is not missed at deploy time — the same step was
missed once already on the `description` column in spec 36.
