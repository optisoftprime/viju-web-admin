# Backend Request — List all customers counted by the dashboard tile

**Raised by:** Frontend (Viju Customer Portal — Admin Web)
**Date:** 20 Aug 2026
**Blocks:** Clicking the dashboard **Total Customers** tile to view all customers

---

## 1. What we built

The **Total Customers** tile on the admin dashboard is now clickable and opens
an **All Customers** modal with a paginated, searchable table backed by
`GET /admin/customers`.

## 2. The problem

The tile and the list read from **two different sources**, and they disagree:

| Surface | Endpoint | Field | Value on dev |
|---|---|---|---:|
| Total Customers tile | `GET /admin/dashboard` | `totalCustomers` | **1,851** |
| All Customers modal | `GET /admin/customers` | `meta.total` | **4** |

An admin clicks a tile reading **1,851** and the table can only page through
**4** rows. The other **1,847** exist in the ERP feed but have not been copied
into the application tables, so `GET /admin/customers` cannot return them —
it reads projected rows only.

This is the `awaitingProjection: 1847` figure already reported in
`GET /admin/dashboard` → `erpReconciliation`.

**We are not asking you to change `meta.total`.** Your implementation guide is
right that inflating it to 1,851 while only 4 rows are pageable would produce
93 empty pages. The count is not the problem — the missing rows are.

### Interim frontend handling

The modal detects the gap and renders an explicit notice rather than looking
broken:

> **Showing 4 of 1,851 customers** — the remaining 1,847 exist in the ERP but
> have not been copied into the portal yet, so they cannot be listed here.

This is a stopgap. It stops the screen contradicting itself; it does not make
the customers visible.

---

## 3. What we need

### 3.1 Primary ask — run the customer projection (no API change)

The single fix that closes this is the **`project:customer` job**, which your
guide reports as running but transferring nothing:

```
project:customer   rows_fetched: 0  rows_projected: 0   (last run succeeded)
```

Once it copies the 1,851 ERP customers into the application tables,
`GET /admin/customers` returns them with **no contract change at all**, and the
tile and the list agree by construction. Everything below is only relevant if
that job cannot be fixed soon.

**Acceptance:** `GET /admin/dashboard` → `erpReconciliation.awaitingProjection`
reaches `0`, and `GET /admin/customers?page=1&pageSize=10` → `meta.total`
equals `totalCustomers`.

---

### 3.2 Fallback ask — serve ERP rows directly if projection cannot be fixed

Only if 3.1 is blocked for more than a few days. Two options; **Option A is
strongly preferred.**

#### Option A — add an `includeUnprojected` flag to the existing endpoint

**Modify:** `GET /api/v1/admin/customers`

| | |
|---|---|
| Existing endpoint | `GET /api/v1/admin/customers?page&pageSize&region&search&hasOfficer&sortBy&sortOrder` |
| Query change | Add `includeUnprojected` — `true \| false`, default **`false`**. When `true`, the result set is the union of projected customers and ERP-feed customers not yet projected. Any other value → `400`. |
| Request body | None (GET). |
| Path params | None. |
| Response change | `meta.total` becomes the size of the union **when the flag is true** — so paging stays arithmetically correct in both modes. Add `meta.projectedTotal` and `meta.unprojectedTotal` so the UI can label rows. |
| Additional per-row field | `isProjected: boolean` — `false` for a row served straight from `erp_raw`. The UI greys these rows and disables actions that need a local record. |
| Row shape | Identical to today's. For an unprojected row, fields with no ERP source are returned as explicit `null` — we expect at minimum `erpId`, `name`, `phone`, `region`. `id` may be `null` when no local record exists yet. |
| Validation / business rules | Default `false` so no existing caller changes behaviour. Region scoping unchanged — a `REGIONAL_ADMIN` stays restricted to their own region and must still not send `?region=`. Records whose `BP_CLUSTER_CODE` is not a Viju region (1–5) stay excluded in both modes. |

Sample row (unprojected):

```json
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
```

#### Option B — a separate read-only ERP listing

Use only if mixing the two sources in one endpoint is undesirable.

| | |
|---|---|
| Method | `GET` |
| Path | `/api/v1/admin/erp/customers` |
| Query parameters | `page` (int ≥ 1, default 1), `pageSize` (any positive int, clamped to 200, applied value echoed in `meta.pageSize`), `search` (matches name or `erpId`), `region` (enum), `projected` (`true \| false \| all`, default `all`) |
| Path parameters | None. |
| Request body | None. |
| Expected response | `{ "data": [ /* row shape as in Option A */ ], "meta": { "total": 1851, "page": 1, "pageSize": 20, "totalPages": 93, "hasNextPage": true, "hasPreviousPage": false, "projectedTotal": 4, "unprojectedTotal": 1847 } }` |
| Validation / business rules | `ADMIN` only, or `REGIONAL_ADMIN` scoped server-side to their own region. Read-only — no write routes. Excludes non-Viju `BP_CLUSTER_CODE` values. Returns `data: []` with valid `meta` when empty, never `404`. |

---

## 4. Why this matters

The tile is the entry point an admin uses to answer "who are my customers?".
Right now it advertises 1,851 and delivers 4. Until projection runs, the
portal cannot show the customer base it reports having — every downstream
screen (assignment, reassignment, broadcasts, audits) is limited to the same
4 records.

**Our recommendation: fix the projection job (3.1) and skip 3.2 entirely.**
It requires no contract change, no frontend rework, and fixes every other
screen at the same time.

---

## 5. Summary

| Ask | Type | Effort on our side |
|---|---|---|
| **3.1** Run `project:customer` | No API change | None — works immediately |
| **3.2 A** `includeUnprojected` flag | Modify existing endpoint | Small — one query param, one row flag |
| **3.2 B** `/admin/erp/customers` | New endpoint | Small — new service method |
