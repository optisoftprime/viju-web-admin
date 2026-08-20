# Frontend Implementation Guide — Outstanding Backend Requirements

Response to `BACKEND_REQUIREMENTS_OUTSTANDING.md`. Everything below is **live on
dev** and verified against the running service (54 automated assertions).

**Base URL:** `https://dev-api-viju.optisoft.com.ng/api/v1`
**Auth:** `Authorization: Bearer <access_token>` — unchanged.
**Interactive reference:** `/api/docs` (generated from the running service).

---

## 0. Read this first — three things that change your assumptions

### 0.1 The ERP feed has 3,747 customers; only 1,851 of them are Viju's

The ERP database is shared with another tenant. Every ERP customer row carries a
`BP_CLUSTER_CODE`, and only codes **1–5** are Viju's Nigerian regions:

| BP_CLUSTER_CODE | Rows | Meaning |
|---|---:|---|
| 1 / 2 / 3 / 4 / 5 | **1,851** | LAGOS / EASTERN / SOUTH_SOUTH / WESTERN / NORTH — Viju distributors |
| `GZ020` | 1,832 | 广州拓燊客户编码 — a different company's customers |
| `9` | 58 | 其他客户 ("other customers") |
| `GZ001` | 6 | 泷迪客户编码 — another tenant |
| **unmappable total** | **1,896** | reported as `unmappedRegionCount`, never counted as distributors |

So **`totalCustomers` is 1,851, not 3,747**. If you ever need the raw number the
whole feed contains, it is `erpReconciliation.erpTotal`. This is the answer to
"the count is wrong" — the count was never just under-reporting, it was reporting
*projected rows* (4) instead of *ERP rows*.

### 0.2 The projector is stalled — that is why local data looks empty

Three separate pieces exist: **ingest** (ERP → `erp_raw` landing tables),
**projection** (`erp_raw` → application tables), and **this API**. Ingest is
healthy. Projection is running but copying nothing:

```
project:customer   rows_fetched: 0  rows_projected: 0   (last run succeeded)
```

Result: 1,851 ERP customers, **4** in the application table. `PurchaseItem` is
empty entirely, which is why order line items come back as `[]`.

**Neither job lives in this repository.** The API now reads `erp_raw` directly
for counts, credit limits and freshness so your screens are accurate today, but
per-customer detail can only be as complete as what the projector has copied.
Chase that separately — it is the single biggest unlock for real data.

What this means per screen:

| Field | Works now | Fills in when the projector runs |
|---|---|---|
| `totalCustomers`, `unmappedRegionCount`, `lastErpSyncAt` | Yes — read from `erp_raw` | — |
| `creditLimit`, `lastSyncedAt` per customer | Yes — read from `erp_raw` | — |
| Customer rows in the list/detail | Only the 4 projected | All 1,851 |
| `lines[]` on order detail, statement `INVOICE` rows | Empty | Populated |

### 0.3 `pageSize` no longer 400s

Any positive integer is accepted and clamped server-side to **200**. Always read
`meta.pageSize` back — that is the value actually applied. Your free numeric
page-size input can send whatever the user types.

---

## 1. B-1.1 — `GET /admin/customers`

**Roles:** ADMIN, REGIONAL_ADMIN (scoped to own region).

### New query parameters

| Param | Values | Notes |
|---|---|---|
| `hasOfficer` | `true` \| `false` | Server-side filter. Stop fetching every page and filtering client-side. Anything else → **400** |
| `sortBy` | `name` \| `erpId` \| `region` \| `outstandingBalance` \| `supportTickets` \| `createdAt` | `createdAt` is new. Unknown value → **400** |
| `sortOrder` | `asc` \| `desc` (default `desc`) | Only applied with `sortBy` |
| `pageSize` | any positive integer | Clamped to 200, echoed in `meta.pageSize` |

### New fields on every row

```json
{
  "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
  "name": "ADLAK",
  "erpId": "10110003",
  "phone": "+2348168584112",
  "region": "LAGOS",
  "accountStatus": "ACTIVE",
  "outstandingBalance": -10140600.1232,
  "assignedOfficerId": null,
  "createdAt": "2026-08-13T14:06:51.169Z",
  "hasOfficer": false,
  "stockBalanceCartons": 0,
  "lastSyncedAt": "2026-08-16T23:01:03.287Z",
  "_count": { "supportTickets": 0 },
  "officerAssignments": []
}
```

- **`stockBalanceCartons`** — cartons paid for but not yet loaded (ordered minus
  completed loading requests, floored at 0).
- **`lastSyncedAt`** — when the ERP last reported this customer, read from the
  ERP feed. `null` when the feed has no row for that `erpId`. Use it for the
  freshness indicator.
- **`hasOfficer`** — mirrors the filter, so you can render the column without
  inspecting `officerAssignments`.

### On `meta.total`

`meta.total` is **the number of rows this filter matches**, so pagination stays
arithmetically correct — making it 1,851 while only 4 rows are pageable would
give you 93 empty pages.

> **The tile you wanted fixed is on the dashboard.** Use
> `GET /admin/dashboard` → `totalCustomers` for "Total Customers". Use
> `meta.total` for "showing X of Y" under the table.

### Frontend work

1. Add `hasOfficer` to the assignment screen's query; delete the client-side filter.
2. Add `createdAt` to the sortable columns.
3. Render `stockBalanceCartons` and a freshness stamp from `lastSyncedAt`.
4. Point the page-size input straight at `pageSize`; echo `meta.pageSize`.

---

## 2. B-1.2 — `GET /admin/dashboard`

Live response (real numbers from dev):

```json
{
  "totalCustomers": 1851,
  "totalActiveCustomers": 4,
  "customersWithoutOfficer": 4,
  "totalOutstandingBalance": -45885904.2002,
  "activeOfficers": 10,
  "openTickets": 1,
  "unReadMessage": 0,
  "lastErpSyncAt": "2026-08-17T05:02:42.853Z",
  "unmappedRegionCount": 1896,
  "erpReconciliation": {
    "source": "ERP",
    "erpTotal": 3747,
    "vijuTotal": 1851,
    "syncedTotal": 4,
    "awaitingProjection": 1847,
    "unmappedRegionCount": 1896,
    "lastSyncAt": "2026-08-17T05:02:42.853Z"
  },
  "byRegion": [ … ]
}
```

| Field | Use it for |
|---|---|
| `totalCustomers` | The **Total Customers** tile. ERP-reconciled. Never null — `0` if nothing is known |
| `totalActiveCustomers` | Active-account tile. **Locally known only**, so it tracks `syncedTotal` until projection catches up |
| `customersWithoutOfficer` | "Unassigned" tile — pairs with `?hasOfficer=false` |
| `lastErpSyncAt` | Staleness indicator. If it is hours old, say so rather than implying live data |
| `unmappedRegionCount` | Data-quality warning (see §3) |
| `erpReconciliation.awaitingProjection` | **1,847** — customers the ERP has that the projector hasn't copied. A visible non-zero here is the pipeline alarm |
| `erpReconciliation.source` | `"ERP"` or `"LOCAL"` — `LOCAL` means no feed attached, so counts are local-only |

**Suggested tile treatment:** show `totalCustomers`, and when
`awaitingProjection > 0` add a subdued caption — *"1,847 awaiting sync · last
synced 3h ago"*. That turns a silent wrong number into a visible pipeline state.

---

## 3. B-2 — Region accuracy

### What the backend now guarantees

1. `region` on every response is the enum `LAGOS | EASTERN | SOUTH_SOUTH | WESTERN | NORTH` — never a raw ERP string, never Chinese text. This is enforced by the database type itself.
2. Unmappable ERP codes are **quarantined**, not persisted as garbage.
3. The count is exposed as `unmappedRegionCount` (§2).

> **Note the enum values.** They are *not* `SOUTH_WEST` / `SOUTH_EAST`. They come
> from `BP_CLUSTER_CODE` 1–5. `SOUTH_SOUTH` is displayed as **"SOUTH-SOUTH"**
> (an enum value cannot contain a hyphen).

### New: quarantine list

```http
GET /admin/erp/unmapped-customers?page=1&pageSize=20     # ADMIN
```

```json
{
  "data": [{
    "erpId": "T20642",
    "name": "潍坊绿霸化工有限公司",
    "phone": "0913580925",
    "bpClusterCode": "GZ020",
    "bpClusterName": "广州拓燊客户编码",
    "lastSeenAt": "2026-08-19T04:30:05.124Z"
  }],
  "meta": { "total": 1896, "page": 1, "pageSize": 20, "totalPages": 95, … }
}
```

`bpClusterCode` is the raw ERP value, so ops can give the ERP team specifics
instead of "some regions are wrong".

### New: pipeline status

```http
GET /admin/erp/sync-status                                # ADMIN
```

Returns `available`, `lastSyncAt`, per-job rows (`ingest:customer`,
`project:customer`, …) and the customer counts per region. Good backing for an
"ERP status" panel.

### Frontend work

Keep `formatRegion()` as a defensive fallback, but it should no longer fire —
if it does, that is a bug worth reporting. Optionally surface
`unmappedRegionCount` as a data-quality banner for admins.

---

## 4. B-3 — `GET /admin/customers/{id}` (new)

**Roles:** ADMIN; REGIONAL_ADMIN **within their own region** (403 outside it).
404 when the id does not exist.

```json
{
  "id": "uuid",
  "erpId": "10110003",
  "name": "ADLAK",
  "phone": "+2348168584112",
  "email": null,
  "address": null,
  "region": "LAGOS",
  "isActive": true,
  "accountStatus": "ACTIVE",
  "outstandingBalance": -10140600.12,
  "stockBalanceCartons": 0,
  "creditLimit": 50000,
  "officerAssignments": [
    { "id": "…", "isPrimary": true, "assignedAt": "2026-01-12T08:00:00.000Z",
      "staff": { "id": "…", "name": "Ifeanyi Okon", "email": "i.okon@viju.com" } }
  ],
  "_count": { "supportTickets": 3 },
  "lastErpSyncAt": "2026-08-16T23:01:03.287Z",
  "createdAt": "2026-08-13T14:06:51.169Z",
  "updatedAt": "2026-08-19T09:15:00.000Z"
}
```

Every optional field is present as an **explicit `null`**, never omitted.

- `creditLimit` — latest effective ERP credit limit (`CREDIT_AMT`). `null` when
  the ERP holds none.
- **`address` is always `null` today.** The ERP customer master has no address
  field at all — the only addresses in the feed are ship-to addresses on
  delivery documents, and resolving one is a ~1.4s unindexed scan of 372k rows
  that frequently returns nothing. Populating this needs either an address on
  the ERP customer master or an index from the ingest team. **Do not build UI
  that depends on it yet** — render the row only when non-null.

> **Duplicate phone numbers** (same phone against several customers) are an
> ingest-side de-duplication issue and are not fixed by this endpoint. It needs
> a rule from Viju on which record wins.

---

## 5. B-4.1 — `GET /admin/officers/{id}`

**Roles:** ADMIN; REGIONAL_ADMIN **within their own region** — this is the
Regional Portal case, and it is now allowed (403 outside the region, 404 if
unknown).

```json
{
  "id": "uuid",
  "name": "Ifeanyi Okon",
  "email": "i.okon@viju.com",
  "phone": "+2348012345678",
  "region": "LAGOS",
  "role": "OFFICER",
  "isActive": true,
  "lastLoginAt": null,
  "createdAt": "2026-01-12T08:00:00.000Z",
  "_count": { "customers": 24, "supportTickets": 3, "chatThreads": 11 },
  "customers": [
    { "id": "…", "name": "Ade Foods Ltd", "erpId": "10110003", "region": "LAGOS" }
  ],
  "distributors": 24,
  "openTickets": 3
}
```

- `role` is **`OFFICER`**, not `ACCOUNT_OFFICER` — that is the value the enum has
  always used across this API.
- `lastLoginAt` is `null` until first login → render **"Never"**.
- `_count.chatThreads` counts customers this officer has a conversation with.
- `distributors` / `openTickets` are deprecated aliases of the `_count` fields,
  kept so the existing admin screen does not break. Migrate to `_count`.

---

## 6. B-4.2 — `GET /admin/audit/chats`

**Roles:** ADMIN **and REGIONAL_ADMIN** (newly allowed). A regional admin is
always scoped to their own region regardless of what `region` they send — the
Customer Chats panel no longer degrades to an error notice.

### New filters

| Param | Notes |
|---|---|
| `officerId` | Exact UUID. **Use this instead of `officerName`** — names are ambiguous. Non-UUID → 400 |
| `customerId` | Exact UUID |

`officerName` is retained for the free-text audit screen.

### Response

One row per **conversation** (not per message):

```json
{
  "data": [{
    "id": "<customerId>:<officerId>",
    "customer": { "id": "…", "name": "Adeola Distributors Ltd", "region": "LAGOS" },
    "officer":  { "id": "…", "name": "Chinedu Okafor" },
    "messageCount": 24,
    "lastMessageAt": "2026-08-18T16:40:00.000Z",
    "messages": [ { "id": "…", "senderType": "CUSTOMER", "content": "…",
                    "attachmentUrl": null, "createdAt": "…" } ]
  }],
  "meta": { "total": 57, "page": 1, "pageSize": 20, … }
}
```

- An officer with no threads returns **`data: []` with a valid `meta`** — never 404.
- `messages` is capped at the 200 most recent; `messageCount` is the true total.
- `id` contains a colon — `encodeURIComponent` it if it ever goes in a URL.
- Read-only. There is no write route on this view.

### Frontend work

Switch `OfficerDetailsModal`'s chat panel from `officerName` to
`officerId={officer.id}`, and drop the "may be role-blocked" guard.

---

## 7. B-5 — Mobile (Flutter)

### 7.1 New: `GET /customers/me/statement` (B-5.1, B-5.2, B-5.5)

JSON statement, so labels come from the payload rather than being hardcoded.

**Query:** `period=LAST_30_DAYS | LAST_90_DAYS | LAST_6_MONTHS | YEAR_TO_DATE | CUSTOM`
(default `LAST_30_DAYS`), plus `startDate`/`endDate` **required only** for
`CUSTOM`.

```json
{
  "customerName": "LATLEK",
  "code": "40510009",
  "period": "YEAR_TO_DATE",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-08-20T18:05:17.198Z",
  "openingBalance": 3539642287.26,
  "closingBalance": 3620342287.26,
  "totalDebit": 0,
  "totalCredit": 80700000,
  "lines": [{
    "date": "2026-06-04T00:00:00.000Z",
    "type": "PAYMENT",
    "reference": "6301-202606040252",
    "description": "Payment received",
    "debit": 0,
    "credit": 2000000,
    "runningBalance": 3541642287.26
  }]
}
```

- **`customerName`** replaces `distributorName`; **`code`** replaces `erpId`.
- **`type`** is a real enum: `INVOICE` | `PAYMENT` | `TRANSPORT_ALLOWANCE`. The
  three movement types are no longer conflated. A transport allowance is a
  payment that settles a delivery allowance.
- `debit`/`credit` are always numbers — `0`, never `null`.
- **`runningBalance` is computed server-side** in strict chronological order.
  **Do not recompute it on the client** — that is what made web and mobile
  disagree. Ties on the same timestamp are broken deterministically
  (INVOICE → PAYMENT → TRANSPORT_ALLOWANCE, then id).
- For any window: `closingBalance = openingBalance + Σ(credit) − Σ(debit)` —
  asserted by the test suite.

**Errors:** `period=CUSTOM` without dates → 400; `startDate > endDate` → 400;
unknown `period` → 400.

### 7.2 Statement download (B-5.2)

`GET /customers/me/account-statement.pdf` and `…/stock-statement.pdf` now accept
the **same `period` presets**, so "Last 30 Days" means the same thing in the
download as on screen.

### 7.3 Transaction status (B-5.3)

Status is no longer defaulted to `PROCESSING`. It is mapped from the ERP state
through a published table, and `statusUpdatedAt` says when it last changed.

`PENDING | PROCESSING | LOADED | DISPATCHED | DELIVERED | CLOSED | CANCELLED`

(`SHIPPED` still exists on legacy rows only; treat it as `DISPATCHED`. New syncs
never produce it.)

The ERP→enum mapping lives in `src/modules/erp/order-status.ts` and is the single
source both clients should word from — an unrecognised ERP state maps to
`PENDING`, never a raw ERP string:

| ERP state | Portal status |
|---|---|
| PENDING, NEW, OPEN, UNAPPROVED, AWAITING_APPROVAL | `PENDING` |
| PROCESSING, APPROVED, IN_PROGRESS, PARTIALLY_DELIVERED | `PROCESSING` |
| LOADED, LOADING_COMPLETED | `LOADED` |
| DISPATCHED, SHIPPED, IN_TRANSIT | `DISPATCHED` |
| DELIVERED, RECEIVED | `DELIVERED` |
| CLOSED, COMPLETED, SETTLED, FINISHED | `CLOSED` |
| CANCELLED, CANCELED, VOID, REJECTED | `CANCELLED` |

> Existing rows keep whatever status they were given before this change; they
> correct themselves on the next ERP sync of that order.

### 7.4 Transaction detail lines (B-5.4)

`GET /customers/me/purchases/{id}` now returns the six columns:

```json
{
  "id": "…", "orderId": "VJ-2026-675", "status": "CLOSED",
  "statusUpdatedAt": "2026-06-04T09:12:00.000Z",
  "accountBalance": 1240000,
  "lines": [{
    "product": "Viju Milk 330ml",
    "itemCode": "ITM-0099",
    "quantity": 120,
    "unitPrice": 2500,
    "amount": 300000,
    "accountBalance": 1240000
  }],
  "items": [ … ]
}
```

- `lines` is `[]` — **never `null`** — when the ERP supplied none.
- `accountBalance` comes from the same ledger as the statement, so the two agree.
- `items` is the old shape, kept temporarily. Migrate to `lines`.
- **`lines` is empty on dev right now** because `PurchaseItem` has 0 rows — the
  projector is not writing line items (§0.2). The contract is live; the data
  arrives when projection is fixed.

---

## 8. Status summary

| Register row | Item | Status |
|---|---|---|
| 3, 5 | Total customer count | **Done** — ERP-reconciled on the dashboard |
| 4 | Region accuracy | **Done** at the API; quarantine list + count exposed. Ingest-side normalisation is the external projector's job |
| 8 | Customer detail parity | **Done** except `address` (not in the ERP feed) |
| 14 | Officer profile + chats | **Done** — officer detail + `officerId` filter + REGIONAL_ADMIN access |
| 16, 17, 18, 20, 21, 22 | Mobile statement/payments | **Done** at the API — JSON statement, periods, typed movements, server-side running balance, status mapping, line items |

### Still blocked on someone else

1. **The projector** (`project:*` jobs, not in this repo) copies 0 rows. Until it
   runs, only 4 of 1,851 customers exist locally, and order line items stay
   empty. Highest-value fix available.
2. **Customer address** — needs a field on the ERP customer master.
3. **Duplicate phone numbers** — needs a de-duplication rule from Viju.

---

## 9. Quick reference — what changed

| Method | Path | Change |
|---|---|---|
| GET | `/admin/customers` | `hasOfficer`, `sortBy=createdAt`, `stockBalanceCartons`, `lastSyncedAt`, `hasOfficer`, `createdAt`; `pageSize` clamped not rejected |
| GET | `/admin/customers/{id}` | **New** — ERP-parity detail |
| GET | `/admin/dashboard` | `totalCustomers` now ERP-reconciled; `totalActiveCustomers`, `customersWithoutOfficer`, `lastErpSyncAt`, `unmappedRegionCount`, `erpReconciliation` |
| GET | `/admin/officers/{id}` | `_count{customers,supportTickets,chatThreads}`, `customers[]`, `createdAt`; REGIONAL_ADMIN allowed in own region |
| GET | `/admin/audit/chats` | `officerId`/`customerId` filters; REGIONAL_ADMIN allowed, region-scoped |
| GET | `/admin/erp/unmapped-customers` | **New** — region quarantine list |
| GET | `/admin/erp/sync-status` | **New** — ingest/projection freshness |
| GET | `/customers/me/statement` | **New** — JSON statement, typed movements, server-side running balance |
| GET | `/customers/me/account-statement.pdf` | Accepts `period` presets |
| GET | `/customers/me/purchases/{id}` | `lines[]`, `accountBalance`, `statusUpdatedAt`; real status mapping |
| — | All paginated endpoints | `pageSize` accepts any positive integer, clamped to 200, applied value in `meta.pageSize` |
