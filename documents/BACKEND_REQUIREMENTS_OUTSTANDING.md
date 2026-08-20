# Viju Customer Portal — Outstanding Backend Requirements

Derived from `Viju_Issues_Status_Register.docx` (22 rows). Everything resolvable
on the frontend has been implemented; what remains below is blocked on backend
or ERP changes.

---

## B-1 — Accurate + total customer count (register rows 3, 5, 8)

**Type:** modification of existing endpoints.

### B-1.1 `GET /api/v1/admin/customers`

| | |
|---|---|
| Existing endpoint | `GET /api/v1/admin/customers?page&pageSize&region&search` |
| What must change | `meta.total` must be the ERP-reconciled customer count, not the count of rows currently persisted locally. Today it reflects only synced rows, so the portal under-reports. |
| Request body changes | None (GET). |
| Query / filter changes | Add `hasOfficer=true\|false` (filter customers with/without an assigned officer — the assignment screen currently fetches every page and filters client-side). Add `sortBy=name\|erpId\|region\|createdAt` and `sortOrder=asc\|desc`. |
| Path parameter changes | None. |
| Response changes | `meta` must always be present and complete: `{ total, page, pageSize, totalPages }`. `total` must be the unfiltered-by-page count **after** the region/search filters are applied. |
| Additional fields required | Per customer: `erpId` (never null — it is the "Code" column), `region` (valid enum or explicit `null`, never a raw ERP string), `outstandingBalance` (number), `stockBalanceCartons` (number), `_count.supportTickets` (number), `lastSyncedAt` (ISO string — so the UI can show data freshness). |
| Validation / business rules | `pageSize` must accept any positive integer (the portal now has a free numeric page-size input, not a fixed list); cap server-side at e.g. 200 and return the applied value in `meta.pageSize` rather than erroring. A `REGIONAL_ADMIN` sending `region` must keep returning 403 — region scoping stays token-derived. |

### B-1.2 `GET /api/v1/admin/dashboard`

| | |
|---|---|
| Existing endpoint | `GET /api/v1/admin/dashboard` |
| What must change | The "Total Customers" tile must be fed by a real ERP-sourced count. |
| Response changes | Add `totalCustomers` (number), `totalActiveCustomers` (number), `customersWithoutOfficer` (number), `lastErpSyncAt` (ISO string \| null). |
| Validation / business rules | Counts must be `0` rather than `null`/absent when unavailable, so the tile never renders empty. If the ERP sync failed, still return the last known counts plus `lastErpSyncAt` so staleness is visible. |

---

## B-2 — Region data accuracy (register row 4)

**Type:** data-quality fix + validation on existing endpoints.

**Problem observed:** ERP is returning empty values and non-Latin (Chinese) strings
in the `region` field, which then flow into `GET /admin/customers`,
`GET /admin/officers` and `GET /admin/audit/tickets`.

**Frontend mitigation already shipped:** `formatRegion()` sanitises unknown,
empty and non-Latin values to `"Unknown"` so the tables never render garbage —
but the underlying data is still wrong and region filtering still misses rows.

**Required from backend:**

1. Normalise `region` at ingest to the canonical enum
   `LAGOS | EASTERN | SOUTH_SOUTH | WESTERN | NORTH`.
2. Where the ERP value cannot be mapped, persist `null` — do **not** persist the
   raw ERP string.
3. Reject/quarantine ERP records whose region fails to map, and expose the count
   via the dashboard (`unmappedRegionCount`) so the mismatch is visible.
4. Every region-carrying response must use the enum, never a display label.

---

## B-3 — Customer detail parity with ERP (register row 8)

**Type:** new endpoint.

| | |
|---|---|
| Method | `GET` |
| Path | `/api/v1/admin/customers/{id}` |
| Path parameters | `id` — internal customer UUID. |
| Query parameters | None. |
| Request body | None. |
| Expected response | `200` with: `{ "id": "uuid", "erpId": "VJ-00987", "name": "Ade Foods Ltd", "phone": "08087654321", "email": "…\|null", "address": "…\|null", "region": "LAGOS\|null", "isActive": true, "outstandingBalance": 1240000, "stockBalanceCartons": 320, "creditLimit": 2000000, "officerAssignments": [{ "id": "…", "staff": { "id": "…", "name": "…" }, "assignedAt": "ISO" }], "_count": { "supportTickets": 3 }, "lastErpSyncAt": "ISO\|null", "createdAt": "ISO", "updatedAt": "ISO" }` |
| Validation / business rules | `404` if not found. `REGIONAL_ADMIN` may only read a customer in their own region → `403` otherwise. All optional fields must be present as explicit `null` rather than omitted. Duplicate phone numbers must be de-duplicated at ingest (currently the same phone appears against multiple customers). |

---

## B-4 — Regional Portal: officer profile + customer chats (register row 14)

**Type:** one new endpoint + one modification.

**Frontend status:** the officer row is now clickable and opens an
`OfficerDetailsModal` showing the profile plus the officer's customer
conversations. The chat panel currently calls `GET /admin/audit/chats` with
`officerName`, which is name-based and therefore ambiguous, and may be
role-blocked for a `REGIONAL_ADMIN`. Both need fixing.

### B-4.1 New — officer detail

| | |
|---|---|
| Method | `GET` |
| Path | `/api/v1/admin/officers/{id}` |
| Path parameters | `id` — officer UUID. |
| Query parameters | None. |
| Request body | None. |
| Expected response | `200` with: `{ "id": "uuid", "name": "…", "email": "…", "phone": "…", "region": "LAGOS\|null", "role": "ACCOUNT_OFFICER", "isActive": true, "lastLoginAt": "ISO\|null", "createdAt": "ISO", "_count": { "customers": 24, "supportTickets": 3, "chatThreads": 11 }, "customers": [{ "id": "…", "name": "…", "erpId": "…", "region": "…" }] }` |
| Validation / business rules | `404` if not found. `REGIONAL_ADMIN` must be allowed to read officers **in their own region** (this is the Regional Portal use case) and `403` outside it. `lastLoginAt` is `null` until first login — the UI renders "Never". |

### B-4.2 Modify — chat audit

| | |
|---|---|
| Existing endpoint | `GET /api/v1/admin/audit/chats?page&pageSize&region&customerName&officerName&keyword&startDate&endDate` |
| What must change | Filtering by officer name is ambiguous, and the route is admin-only. |
| Query / filter changes | Add `officerId` (UUID) and `customerId` (UUID) as exact filters. Keep `officerName` for the audit screen. |
| Path parameter changes | None (alternatively expose `GET /api/v1/admin/officers/{id}/chats` with the same response shape — either is acceptable). |
| Response changes | Each thread must include `officer: { id, name }` and `customer: { id, name, region }` — currently either can come back `null`, which forces the UI to fall back to "Unknown customer". |
| Role changes | `REGIONAL_ADMIN` must be authorised, scoped server-side to their own region. Without this, the Customer Chats panel degrades to an error notice. |
| Validation / business rules | Read-only — no write routes. `messages` stays capped (200 most recent) with `messageCount` as the true total. Return an empty `data: []` with valid `meta` when the officer has no threads, not `404`. |

---

## B-5 — Mobile app items (register rows 16, 17, 18, 20, 21, 22)

These belong to the Flutter app repository, but every one of them is blocked on
the same backend/ERP mapping work, so the API changes are listed here.

### B-5.1 Statement of account — field naming and content (rows 16, 22)

| | |
|---|---|
| Existing endpoint | The customer statement endpoint (`GET /customers/{id}/statement` or equivalent). |
| What must change | Labels are driven by the payload keys. Expose `customerName` (replacing `distributorName`) and `code` (replacing `erpId`). The statement must correctly separate the three movement types: **Payment**, **Transport Allowance**, **Invoice** — currently they are conflated. |
| Response changes | Each line: `{ "date": "ISO", "type": "PAYMENT\|TRANSPORT_ALLOWANCE\|INVOICE", "reference": "…", "description": "…", "debit": 0, "credit": 0, "runningBalance": 0 }`. |
| Validation rules | `type` must be an enum, not free text. `debit`/`credit` must be numbers (`0`, never `null`). |

### B-5.2 Statement download — "Last 30 Days" (row 17)

| | |
|---|---|
| Existing endpoint | The statement download/export endpoint. |
| Query / filter changes | Accept `period=LAST_30_DAYS \| LAST_90_DAYS \| LAST_6_MONTHS \| YEAR_TO_DATE \| CUSTOM`, plus `startDate`/`endDate` when `period=CUSTOM`. |
| Validation rules | `startDate`/`endDate` required only for `CUSTOM`; `400` if `startDate > endDate`. Default to `LAST_30_DAYS` when `period` is omitted. |

### B-5.3 Transaction status shows "Processing" instead of "Closed" (row 18)

| | |
|---|---|
| Existing endpoint | The customer transactions/orders list. |
| What must change | Status is hardcoded/defaulted to `PROCESSING`. It must be mapped from the ERP order state. |
| Response changes | `status` as an explicit enum — e.g. `PENDING \| PROCESSING \| LOADED \| DISPATCHED \| DELIVERED \| CLOSED \| CANCELLED` — plus `statusUpdatedAt` (ISO). |
| Validation rules | Publish the ERP-state → enum mapping table so web and mobile render identical wording. Unmappable ERP states must return `PENDING`, never a raw ERP string. |

### B-5.4 Payment details columns (row 20)

| | |
|---|---|
| Existing endpoint | The payment/transaction detail endpoint. |
| What must change | The detail payload does not carry line items. |
| Response changes | Add `lines: [{ "product": "…", "itemCode": "…", "quantity": 0, "unitPrice": 0, "amount": 0, "accountBalance": 0 }]` — the six columns the app must display. |
| Validation rules | `lines` must be `[]` (never `null`) when the ERP returns none. All monetary fields numeric. |

### B-5.5 Running balance calculated correctly (row 21)

| | |
|---|---|
| Existing endpoint | Statement / transaction endpoints. |
| What must change | Running balance must be computed server-side from the Customer Credit table, in strict chronological order, and returned per line — it must **not** be recomputed on the client, or web and mobile will disagree. |
| Response changes | `runningBalance` per line, plus `openingBalance` and `closingBalance` on the statement envelope. |
| Validation rules | For any window: `closingBalance = openingBalance + Σ(credit) − Σ(debit)`. Ties in timestamp must be broken by a stable, documented key (e.g. ERP sequence number). |

---

## Summary of what is blocked on whom

| Register row | Item | Blocked on |
|---|---|---|
| 3, 5 | Total customer count | B-1 (ERP sync + `meta.total`) |
| 4 | Region accuracy | B-2 (ERP normalisation) |
| 8 | Customer detail parity | B-2 + B-3 |
| 14 | Officer profile + chats | B-4 (frontend UI already shipped) |
| 16, 17, 18, 20, 21, 22 | Mobile statement/payments | B-5 (Flutter repo + ERP mapping) |

Rows 1, 2, 6, 7, 9, 10, 11, 12, 13, 15, 19 require no further backend work.
