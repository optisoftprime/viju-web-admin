# Backend Request — Account Officer Dashboard Interactivity

**Raised by:** Frontend (Viju Customer Portal — Account Officer Web)
**Date:** 22 Aug 2026
**Feature spec:** `context/feature-spec/33-update-account-officer-page.md`
**Related:** `BACKEND_API_REQUESTS.md` (admin / regional admin, all items closed)

> **STATUS: CLOSED — all five items answered and integrated.** See
> **§0 Resolution** below for what shipped. The rest of the document is the
> original request, kept as the record of what was asked for and agreed.

The Account Officer dashboard tiles are now interactive: **Total Customers**
opens the customer list, **Open Tickets** and **Unread Messages** jump straight
to the customer that owns one and open the conversation. Three of the four
worked fully at the time of asking. The gaps below are what stood between the
approximations and the behaviour the spec describes.

Every item shipped with a working fallback — nothing was blocked. The
**Example Response** column shows the body the UI expects to consume; §2 has
each one pretty-printed.

---

## 0. Resolution — all five answered

**Answered:** `documents/FRONTEND_GUIDE_ACCOUNT_OFFICER.md` (backend branch `dev`)
**Frontend integrated:** 22 Aug 2026

| # | Outcome | What changed on the frontend |
|---|---|---|
| **AO-C1** | **Done.** `unreadMessages` and `lastMessageAt` on every row, a `?unreadMessages=true` filter, and two new sort columns. Row counts sum to the dashboard tile. | The notification-feed workaround is **deleted**. The tile now asks `?unreadMessages=true&sortBy=lastMessageAt&sortOrder=asc&pageSize=1` for the distributor who has waited longest — one request, and it no longer goes stale when the bell is marked read. A matching **Unread Messages** tab and an **UNREAD** column were added to the officer table. |
| **AO-T1** | **Done.** `customerId` and `status` applied in SQL, `meta.total` counts the filtered set. Rows gained `repliesCount` and a fuller `customer`. | The Tickets tab now asks for `?customerId=`, so the client-side narrowing and the "n rows hidden" line are **deleted**. The Open Tickets tile asks `?status=OPEN,IN_PROGRESS,AWAITING_CUSTOMER&pageSize=1` instead of fetching 50 and scanning. `repliesCount` and `customer.phone/email` are now required in the types. |
| **AO-P1** | **Confirmed** — the envelope always was standard, and `search` also matches phone. | Kept the defensive `meta` read; the guide calls it harmless and it costs nothing. |
| **AO-P2** | **Done.** `stockBalanceCartons` on every row, from the same helper as `/admin/customers`, and always a `number` on this route. | The em-dash STOCK branch is **deleted** in the officer customers modal, and a **STOCK** column was added to the officer dashboard table. |
| **AO-D1** | **Held**, and the backend found and fixed one violation of its own — `GET /customers/statement` was rounding ERP money to 2 dp. | Nothing to change: this portal has no statement screen (that route is mobile-only), and every formatter here already preserves what it is given. |

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| **§3.1** `GET /officers/dashboard` now counts **primary or secondary** assignments, matching the list it opens. Tiles go **up** for any officer holding secondary assignments. | No code change — and it fixes a real inconsistency, since the tiles are clickable now and one that disagreed with the screen it opened would read as a bug. |
| **§3.2** `GET /customers/statement` returns unrounded money. | Not consumed by this app. |
| `OfficerTicket.repliesCount` and `customer.phone/email` promoted from optional to required | Types tightened; nothing read them defensively. |
| `lastPurchaseDate` is nullable | `formatDate()` now goes through `safeDateText`, so a distributor who has never ordered reads "N/A" rather than "Invalid Date". |

---

## 1. Issue table

| # | Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|---|
| **AO-C1** | **There is no way to tell which customer has an unread message.** The Unread Messages tile shows a total (`GET /officers/dashboard` → `unreadMessages`), but nothing in the API says *whose* messages they are. `GET /officers/customers` returns `openTickets` per row and no equivalent for chat. | YES | YES | N/A — `GET /api/v1/officers/customers` | This is the spec's central ask: clicking the tile must select the customer who sent the unread message and open the Chat tab on their thread. Please add **`unreadMessages: number`** to every row of `GET /officers/customers` — the mirror of the `openTickets` field that is already there — plus a **`?unreadMessages=true`** filter so the table can show only those customers, matching the existing `?activeTickets=true`. Also useful: **`lastMessageAt`**, so the list can be ordered by who has been waiting longest. **Interim:** the tile reads the officer's unread `CHAT_MESSAGE` notifications and uses the `customerId` on the first one. That only covers the most recent 20 notifications and stops working the moment the officer marks the bell read — a customer can be waiting with no way to reach them from the tile. | **`GET /officers/customers?unreadMessages=true`** → 200<br>`{ "data": [ { "id": "bd5d…", "name": "ADLAK", "accountNumber": "10110003", "phone": "+2348168584112", "region": "LAGOS", "walletBalance": -10140600.1232, "accountStatus": "ACTIVE", "openTickets": 2, "unreadMessages": 3, "lastMessageAt": "2026-08-22T07:41:00.000Z", "lastPurchaseDate": "2026-08-19T00:00:00.000Z", "lastContactDate": "2026-08-21T16:02:00.000Z" } ], "meta": { "total": 4, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }`<br>`unreadMessages: 0` on a customer with nothing waiting, never omitted. |
| **AO-T1** | **`GET /tickets/officer` cannot be filtered by customer or by status.** The Tickets tab sits inside one distributor's detail view, so it must show that distributor's tickets; and the Open Tickets tile needs *an unresolved* ticket, not merely the newest one. | YES | YES | N/A — `GET /api/v1/tickets/officer?customerId=&status=` | Please add **`customerId`** (exact UUID; unknown or malformed → 400) and **`status`** (the ticket enum, repeatable or comma-separated — the same parameter you added to `GET /admin/audit/tickets` for RA-T1), with `meta.total` counting the filtered set. Without them a page of 20 mixed-customer tickets can leave the tab showing 1 row while the pager reports hundreds, and the tile has to scan a page client-side to find an open one. **Interim:** the tab filters the fetched page by `customerId` and labels how many rows it hid; the tile fetches 50 and picks the first unresolved status itself. | **`GET /tickets/officer?customerId=bd5d…&status=OPEN,IN_PROGRESS&page=1&pageSize=20`** → 200, envelope and row shape unchanged, only the filter and `meta` differ<br>`{ "data": [ { "id": "9f1c…", "ticketId": "TCK-00123", "customerId": "bd5d…", "category": "BILLING", "subject": "Wallet not credited", "description": "I paid on Monday…", "attachmentUrl": null, "status": "OPEN", "createdAt": "2026-08-20T09:14:02.000Z", "updatedAt": "2026-08-21T10:02:11.000Z", "repliesCount": 1, "customer": { "id": "bd5d…", "erpId": "10110003", "name": "ADLAK", "phone": "+2348168584112", "email": null } } ], "meta": { "total": 2, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }`<br>Unknown status → `400 { "message": "status must be one of: OPEN, IN_PROGRESS, AWAITING_CUSTOMER, RESOLVED", "code": "VALIDATION_ERROR" }` |
| **AO-P1** | **`GET /officers/customers` pagination is unconfirmed.** The service sends `page`, `pageSize` and `search`, but we have never seen a documented `meta` block back from this route, so the All Customers modal cannot be sure its pager is arithmetically correct. | YES | Needs confirmation | N/A — `GET /api/v1/officers/customers` | Please confirm the route returns the standard `{ data, meta }` envelope with `total`, `page`, `pageSize`, `totalPages`, `hasNextPage`, `hasPreviousPage`, that `pageSize` is echoed back as applied, and that `search` matches name **and** account number server-side. If it currently returns every assigned customer in one unpaginated array, say so and we will page it in the browser instead of pretending otherwise. **Interim:** the modal reads `meta` defensively and falls back to the row count, so a missing block degrades to a single page rather than breaking. | **`GET /officers/customers?page=1&pageSize=20&search=adlak`** → 200<br>`{ "data": [ { "id": "bd5d…", "name": "ADLAK", "accountNumber": "10110003", "phone": "+2348168584112", "region": "LAGOS", "walletBalance": -10140600.1232, "accountStatus": "ACTIVE", "openTickets": 2, "lastPurchaseDate": "2026-08-19T00:00:00.000Z", "lastContactDate": "2026-08-21T16:02:00.000Z" } ], "meta": { "total": 1, "page": 1, "pageSize": 20, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false } }` |
| **AO-P2** | **`GET /officers/customers` rows carry no stock balance.** The officer's All Customers modal reuses the admin table layout, so it has a STOCK column that can only render an em-dash for this role. | YES | YES | N/A — `GET /api/v1/officers/customers` | Please add **`stockBalanceCartons: number`** to each row — the same field `GET /admin/customers` already returns (B-1.1: cartons paid for but not yet loaded, floored at 0). An account officer answering "how much stock is waiting for me to load?" currently has to open each customer's Stock tab one at a time. `null` is acceptable when the ERP holds no figure; the column renders a dash for that. **Interim:** the column shows an em-dash for every officer row. | **`GET /officers/customers`** → 200, one extra field per row<br>`{ "data": [ { "id": "bd5d…", "name": "ADLAK", "accountNumber": "10110003", "walletBalance": -10140600.1232, "stockBalanceCartons": 240, "openTickets": 2, "…": "…" } ], "meta": { "…": "…" } }` |
| **AO-D1** | **Decimal precision must survive the wire.** Every wallet, balance, invoice total and quantity in the app now renders exactly as received — no rounding anywhere. | YES | NO | N/A — all money-bearing routes | No change requested, only a guarantee: please keep sending money and quantity as **full-precision JSON numbers** (`-10140600.1232`), never as pre-rounded numbers and never as pre-formatted strings (`"₦-10,140,600.12"`). A value rounded server-side cannot be recovered by the client, so the portal would silently disagree with the ERP. This covers `outstandingBalance`, `walletBalance`, `creditLimit`, `totalValue`, `deliveryAllowance`, `stockBalanceCartons` and `quantityCartons`. | **Any money-bearing row** → 200<br>`{ "walletBalance": -10140600.1232, "creditLimit": 50000, "stockBalanceCartons": 240.5, "totalValue": 2700000.75 }`<br>**Not** `-10140600.12`, and **not** `"₦-10,140,600.12"`. |

---

## 2. Example responses in full

### 2.1 AO-C1 — `GET /api/v1/officers/customers?unreadMessages=true` → `200`

```json
{
  "data": [
    {
      "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "name": "ADLAK",
      "accountNumber": "10110003",
      "phone": "+2348168584112",
      "region": "LAGOS",
      "walletBalance": -10140600.1232,
      "accountStatus": "ACTIVE",
      "openTickets": 2,
      "unreadMessages": 3,
      "lastMessageAt": "2026-08-22T07:41:00.000Z",
      "lastPurchaseDate": "2026-08-19T00:00:00.000Z",
      "lastContactDate": "2026-08-21T16:02:00.000Z"
    }
  ],
  "meta": {
    "total": 4,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

The two fields that matter are `unreadMessages` and `lastMessageAt`. With them
the tile can name the customer, the table can filter to "waiting on me", and
the list can be ordered by who has waited longest. Without them the tile is
guessing from the notification feed.

`unreadMessages` should sum to the `unreadMessages` figure on
`GET /officers/dashboard`, so the tile and the list agree by construction —
the same relationship the admin customer list and its dashboard tile have.

### 2.2 AO-T1 — `GET /api/v1/tickets/officer?customerId=…&status=…` → `200`

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
      "repliesCount": 1,
      "customer": {
        "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
        "erpId": "10110003",
        "name": "ADLAK",
        "phone": "+2348168584112",
        "email": null
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

`meta.total` counts the **filtered** set. `status` behaves exactly as it does
on `GET /admin/audit/tickets` — repeatable or comma-separated,
case-insensitive, de-duplicated, omitted means every status.

### 2.3 AO-P1 / AO-P2 — `GET /api/v1/officers/customers` → `200`

```json
{
  "data": [
    {
      "id": "bd5dbe51-b00e-4d05-a321-76108e0f3918",
      "name": "ADLAK",
      "accountNumber": "10110003",
      "phone": "+2348168584112",
      "region": "LAGOS",
      "walletBalance": -10140600.1232,
      "stockBalanceCartons": 240,
      "accountStatus": "ACTIVE",
      "openTickets": 2,
      "unreadMessages": 3,
      "lastPurchaseDate": "2026-08-19T00:00:00.000Z",
      "lastContactDate": "2026-08-21T16:02:00.000Z"
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

This is the shape the officer's All Customers modal is written against:
`meta` present and applied, `search` honoured server-side, and the three
per-customer signals (`openTickets`, `unreadMessages`, `stockBalanceCartons`)
that let the officer triage without opening every record.

### 2.4 AO-D1 — precision

```json
{
  "walletBalance": -10140600.1232,
  "creditLimit": 50000,
  "stockBalanceCartons": 240.5,
  "totalValue": 2700000.75,
  "deliveryAllowance": 1500.5
}
```

Send the number the ERP holds. The portal formats for display and never
rounds; a value rounded upstream is lost for good.

---

## 3. Priority

| Priority | Items | Why |
|---|---|---|
| **High** | AO-C1 | The Unread Messages tile is the spec's headline ask and is the one that currently relies on a proxy signal that can go stale. |
| **Medium** | AO-T1 | Two screens narrow a page in the browser, which makes the pager disagree with the rows — the same problem RA-T1 fixed on the audit side. |
| **Medium** | AO-P1 | We cannot be confident the officer modal's pager is correct until the envelope is confirmed. |
| **Low** | AO-P2 | One column renders a dash; everything else works. |
| **Low** | AO-D1 | A guarantee to hold, not a change to make. |

---

## 4. Interim behaviour while these were open (all now removed)

| Item | Interim frontend behaviour |
|---|---|
| AO-C1 | The tile reads unread `CHAT_MESSAGE` notifications and jumps to the `customerId` on the first one; if there is none it says "No unread customer messages right now" rather than doing nothing. |
| AO-T1 | The Tickets tab filters the fetched page by `customerId` and states how many rows it hid; the tile fetches 50 tickets and picks the first unresolved one itself. |
| AO-P1 | `meta` is read defensively and falls back to the row count, so a missing envelope degrades to a single page. |
| AO-P2 | The STOCK column renders an em-dash for officer rows. |
| AO-D1 | Every formatter in the app preserves the decimals it is given. |
