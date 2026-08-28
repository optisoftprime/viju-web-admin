# Backend Request — Regional Admin Parity: Broadcasts, Users & Product Flyers

**Raised by:** Frontend (Viju Customer Portal — Admin & Regional Admin Web)
**Date:** 26 Aug 2026
**Feature spec:** `context/feature-spec/40-many-corrections02.md`
**Related:** `BACKEND_API_REQUESTS.md` (RA-T2, RA-C1, AD-X1), `documents/FRONTEND_GUIDE_INTERACTION_AUDIT.md`, `BACKEND_REQUEST_REGION_EDITING_AND_LOADING_FLOW.md`

> **STATUS: CLOSED — all seven answered and integrated, both open questions
> settled.** See **§0a Resolution**.
>
> *(Original status: OPEN.)*
>
> Spec 40 gives a `REGIONAL_ADMIN` the same four screens an `ADMIN` has —
> Broadcasts, Interaction Audits, Users and Product Flyers — each scoped to
> their own region. **The frontend is done for all four**: they are on the
> sidebar, each page region-scopes itself from the signed-in role, and none of
> them exists twice.
>
> **Interaction Audits already works end to end** and needs nothing from you —
> see **§0**. The other three are authorisation-only asks: the routes, the
> shapes and the filters all exist and are unchanged. What is missing is
> permission for one more role, and the region rule that must come with it.

The **Example Response** column shows the body each endpoint should return at
the shape the UI already binds to. Full pretty-printed versions are in **§3**.


---

## 0a. Resolution — all seven answered, both questions settled

**Answered:** `documents/FRONTEND_GUIDE_REGIONAL_ADMIN_PARITY.md` (backend branch `dev`)
**Frontend integrated:** 26 Aug 2026
**No migration** — authorisation and scoping only.

| # | Outcome | What changed on the frontend |
|---|---|---|
| **RB-1** | **Done.** History scoped server-side, region token-derived and **overriding** anything sent, search confined to the scope. Verified: a LAGOS admin searching a WESTERN broadcast gets 0 hits. | Nothing — it was built to send no `region` and relies on exactly this. |
| **RB-2** | **Done.** Own region only; another region **or a multi-region send that includes their own** is a 403 `REGION_NOT_ALLOWED`. | Nothing — the picker already offers one region, so this only fires on a hand-built request. |
| **RB-3** | **Done, our preference taken:** any out-of-region recipient rejects the **whole call**, nothing written, nothing sent. | Nothing — the form already treats a rejection as "nothing was sent" and keeps its values for a retry. |
| **RU-1** | **Done.** `managed=true` now returns `OFFICER` + `LOADING_OFFICER`, own region, never admins; region and search are `AND`ed in one query, so search cannot escape the region. | The "may list account officers only" caveat is **deleted** from the Users page — the default view no longer under-reports. |
| **RU-2** | **Done.** Two field roles only; **region derived from the token** and overriding what is sent; the role check runs first, so minting an admin returns `ROLE_NOT_ALLOWED` rather than a confusing region error. | Nothing — the hidden region picker and own-region payload are now a no-op, which is the belt-and-braces we wanted. |
| **RU-3** | **Done.** Both bodies, two field roles, own region; `region` in the body **refused**, not ignored; every 409 guard intact and running after the role/region gates. | Nothing — `region` was already omitted for this role. |
| **RF-1** | **Done, reading (a):** flyers stay global and all five routes (including `reorder`) are open. | The page is unchanged, but the **consequence is now stated on it** — see below. |
| **RA-O1** | **Answered: yes, accepted and ignored** on `GET /admin/officers`. Deliberately unlike `GET /admin/customers`, where it is a 403. | Nothing. Both routes' rules are now recorded in `GetOfficersParams.region`, along with why the inconsistency was left alone. |

### The one instruction that needed acting on

**§6 "Still ADMIN-only":** `DELETE /admin/officers/{id}`,
`PATCH /admin/officers/{id}/reassign-customers`, `PATCH /admin/officers/bulk-region`
and `PATCH /admin/customers/bulk-reassign` remain organisation-wide —
*"hide them for this role"*.

- `reassign-customers` and the officer `DELETE` are **not wired to any UI**, so
  there was nothing to hide.
- The two **bulk routes are** wired, and one of them is on a screen a regional
  admin genuinely reaches: `RegionalTablePage` is the same component behind
  `/admin/distributors` **and** `/regional-admin/distributors`. Its checkboxes
  and bulk bar are now gated on `canUseOrgWideBulkActions()`. The officers and
  reassignment screens are gated too — not on their sidebar, but a URL is a URL.
- Single-record assignment is untouched for them.
- `PreviewAccountOfficerModal` pointed a blocked deactivation at "the Customer
  Reassignment page", which is an ADMIN screen. A regional admin is now pointed
  at their own Customers page instead.

### RF-1 (a) — the consequence, surfaced rather than buried

The guide's §8 flags that under reading (a) a regional admin deleting or
deactivating a flyer changes **every** distributor's carousel nationwide, and
that this is worth telling the client. It is now on the screen: a standing
notice on the flyers page for that role, and a second line in the delete
confirmation, which is the last moment it can usefully be said.

**This remains open as a product question.** If the client did not intend a
region-scoped role to hold nationwide authority over the carousel, reading (b)
is the answer and we will scope it properly — the backend has offered.

### Behaviour changes absorbed

| Change | Effect here |
|---|---|
| `REGION_NOT_SET` (403) is now raised on **every** route in this release for an unconfigured regional admin — broadcasts, users and history alike | The Users page and the broadcast history now branch on `isRegionNotSetError` and render it as an account-configuration problem rather than a generic failure. The audits page already did. |
| A multi-region broadcast is refused **even when it includes their own region** | No change — deliberate, and it is the case we argued for. |
| RB-3 names the count in its message ("1 of 2 recipients are outside your region") | Surfaced verbatim by the mutation's error toast. |
| Two assertions in the backend's authorisation spec were **inverted**, since they encoded the old ADMIN-only rule | Noted. The escalation guard is pinned by the new parity spec rather than deleted, which is the part that matters. |

---

## 0. Interaction Audits — nothing requested, and why

Checked before raising anything. `REGIONAL_ADMIN` was authorised on all four
audit routes in an earlier round, and the region scoping is exactly what spec
40 asks for:

| Route | Status | Source |
|---|---|---|
| `GET /admin/audit/tickets` | `REGIONAL_ADMIN` allowed, token-derived region, **overrides** any `region` sent | RA-T2 |
| `GET /admin/audit/chats` | Same | B-4.2 |
| `GET /admin/audit/tickets/export.csv` | Same filters as the list, role allowed | AD-X1 |
| `GET /admin/audit/chats/export.csv` | Same | AD-X1 |
| `GET /tickets/{id}`, `POST /tickets/{id}/replies`, `PATCH /tickets/{id}/status` | `REGIONAL_ADMIN` on tickets in their own region | AD-T1 |
| `GET /chat/{otherUserId}`, `POST /chat/{receiverId}` | `REGIONAL_ADMIN` for customers in their own region | AD-C1 |

**Frontend change only:** the region tab strip was rendering for a regional
admin and doing nothing — the server overrode whatever they pressed. It is now
hidden for that role, `region` is never attached, and the header says which
region they are looking at. The dashboard's Open Tickets tile now deep-links
into the ticket audit rather than the standalone tickets page.

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **RB-1 — a regional admin cannot read broadcast history.** Spec 40 puts the Broadcasts page on their sidebar; the history panel calls `GET /admin/broadcasts/history`, which is an ADMIN route today. | YES | YES | N/A — widen authorisation + add region scoping on `GET /api/v1/admin/broadcasts/history` | Allow `REGIONAL_ADMIN`, **scoped to their own region, server-side**. Apply the same rule the audit routes already use (RA-T2): the region comes from the token and **overrides** anything sent, rather than being honoured or rejected — that way the frontend never has to know which it is. Scoping means: a REGIONAL broadcast is visible if its `targetRegions` contains their region; an INDIVIDUAL broadcast is visible if the target customer is in their region. **The `search` filter added in B-1 must apply within that scope**, not across it — spec 40 is explicit that search must not reach another region. The frontend deliberately sends **no** `region` on this call. | Same envelope as today, filtered — see §3.1 |
| **RB-2 — a regional admin cannot send a regional broadcast.** `POST /admin/broadcasts/regional` is an ADMIN route. | YES | YES | N/A — widen authorisation on `POST /api/v1/admin/broadcasts/regional` | Allow `REGIONAL_ADMIN`, but **only for their own region**. `targetRegions` containing anything else — or more than one region — should be a **403**, not a silent narrowing: an admin who thinks they broadcast to three regions and reached one has been misled. The frontend already narrows the region picker to their own region, so a violation means a hand-built request, and refusing it is right. Please use a distinct `code` (e.g. `REGION_NOT_ALLOWED`) so it can be told apart from a validation failure. | `{ "id": "…", "type": "REGIONAL", "targetRegions": ["LAGOS"], "deliveredCount": 412, … }` |
| **RB-3 — a regional admin cannot send an individual broadcast.** `POST /admin/broadcasts/individual` is an ADMIN route, in both its single-`customerId` and the `customerIds[]` batch form added in B-2. | YES | YES | N/A — widen authorisation on `POST /api/v1/admin/broadcasts/individual` | Allow `REGIONAL_ADMIN` **for customers in their own region only**, on both forms. A `customerId` outside their region should be a 403. For the batch form, please decide and tell us which: reject the whole call, or return the out-of-region ids in a `failed[]` half. **We would prefer rejecting the whole call** — unlike O-2 and C-2 a broadcast is not idempotent, and a half-sent announcement that the sender then retries would double-message the recipients who did receive it. The recipient picker is already scoped: the frontend reads `GET /regional/customers` for this role, so the ids it offers are all in-region by construction. | `{ "id": "…", "type": "INDIVIDUAL", "targetCustomerId": "…", "deliveredCount": 1, … }` |
| **RU-1 — `?managed=true` is ADMIN-only, so a regional admin's Users list is incomplete.** Spec 40 says they manage **account officers and loading officers**. `managed=true` is documented as silently ignored for them, which returns account officers only — loading officers are missing from the default view. | YES | YES | N/A — honour `managed` for `REGIONAL_ADMIN` on `GET /api/v1/admin/officers` | For a `REGIONAL_ADMIN`, `managed=true` should return **both** roles they manage — `OFFICER` and `LOADING_OFFICER` — scoped to their own region, and **never** `ADMIN` or `REGIONAL_ADMIN` rows. **Region must be token-derived and applied to the search too**: spec 40 is explicit that "the user being created or created must be strictly from his region (including the search result)". Please also confirm whether `region` may be sent by this role on this route — **RA-O1 asked and is still unanswered**, and the answer decides whether the Officers screen keeps sending it. Until this lands the default view under-reports, though the role filter still reaches loading officers explicitly, so the screen is usable. | `{ "data": [ { "role": "OFFICER", "region": "LAGOS", … }, { "role": "LOADING_OFFICER", "region": "LAGOS", … } ], "meta": { … } }` |
| **RU-2 — a regional admin cannot create a user.** `POST /admin/officers` is an ADMIN route. | YES | YES | N/A — widen authorisation on `POST /api/v1/admin/officers` | Allow `REGIONAL_ADMIN` to create **`OFFICER` and `LOADING_OFFICER` only**, and **only in their own region**. Both limits need enforcing server-side, with distinct codes: creating an `ADMIN` or another `REGIONAL_ADMIN` must be a 403 (`ROLE_NOT_ALLOWED`), and naming another region must be a 403 (`REGION_NOT_ALLOWED`). **Ideally `region` is derived from the token for this role and any value sent is overridden**, matching the audit rule — the frontend hides the region picker for them and sends their own region, so overriding is a no-op in practice and protects against a hand-built request. A regional admin escalating themselves by minting an admin is the one thing this must not allow. | `{ "id": "…", "role": "OFFICER", "region": "LAGOS", "emailSent": true, … }` |
| **RU-3 — a regional admin cannot edit or deactivate a user.** `PATCH /admin/officers/{id}` is an ADMIN route, in both bodies: `{ isActive }` and the profile fields added in O-1. | YES | YES | N/A — widen authorisation on `PATCH /api/v1/admin/officers/{id}` | Allow `REGIONAL_ADMIN` on **both** bodies, for **`OFFICER` and `LOADING_OFFICER` records in their own region only**. Editing an admin, a fellow regional admin, or anyone outside their region must be a 403. **`region` in the body should be refused for this role** (`REGION_NOT_ALLOWED`) — a regional admin moving a user into another region is a transfer out of their own scope, and the receiving region's admin has not agreed to it. The frontend already hides the region field for them and omits it from the body. All existing 409 guards (`OFFICER_HAS_CUSTOMERS`, `LAST_ACTIVE_ADMIN`, `SELF_DEACTIVATION`) should apply unchanged. | `{ "id": "…", "name": "Ada Obi", "region": "LAGOS", "role": "OFFICER", "isActive": true, "changed": true }` |
| **RF-1 — a regional admin cannot manage product flyers.** All four flyer routes are ADMIN-only. Spec 40 asks for view, create, edit, delete and activate/deactivate. | YES | YES | N/A — widen authorisation on `GET`, `POST`, `PATCH` and `DELETE /api/v1/admin/product-flyers` | Allow `REGIONAL_ADMIN` on all four. **A question before you implement it:** flyers carry no region and appear in *every* distributor's home carousel, so unlike the other three items there is nothing to scope — a regional admin creating or deleting one is acting organisation-wide. Two readings of the spec, and we need you to pick: **(a)** flyers stay global and a regional admin may edit any of them, which is what the spec literally asks for; or **(b)** flyers gain a nullable `region`, where `null` means "everyone" and a regional admin may only touch rows in their own region. **We have built for (a)** — the page is unchanged and simply reachable — because (b) changes the distributor app's carousel contract as well, and that is not something to infer. If you prefer (b), say so and we will add the region control. | Same as today — see §3.2 |

---

## 2. What the frontend already does, so you can check the assumptions

None of these need a change from you; they are listed so a mismatch is caught
before it ships.

| Surface | What the signed-in `REGIONAL_ADMIN` gets |
|---|---|
| Broadcast **history** | No `region` sent. Relies entirely on RB-1's server-side scoping. |
| Broadcast **regional** target picker | Narrowed to their own region only. An unconfigured account (no region on the staff record) sees an empty picker and an explicit "ask an administrator" notice, rather than a silent failure. |
| Broadcast **individual** recipient picker | Reads `GET /regional/customers`, not `GET /admin/customers` — the latter is a `403 REGION_NOT_ALLOWED` for this role if a region is named, and offers every customer in the organisation if one is not. |
| **Users** role picker | `OFFICER` and `LOADING_OFFICER` only, on create and on the role filter. `ADMIN` and `REGIONAL_ADMIN` are not offered. |
| **Users** region field | Hidden on create and edit; the create payload carries their own region, the edit payload omits `region` entirely. |
| **Audits** region strip | Hidden; `region` never sent (it was being overridden anyway). |
| **Flyers** | Unchanged — the page is simply reachable. |

---

## 3. Example responses, pretty-printed

### 3.1 `GET /api/v1/admin/broadcasts/history?search=depot&page=1&pageSize=10` as a LAGOS regional admin (RB-1)

Identical envelope to the admin response. Every row is either a REGIONAL
broadcast whose `targetRegions` includes `LAGOS`, or an INDIVIDUAL broadcast to
a LAGOS customer. `meta.total` counts that scope only.

```json
{
  "data": [
    {
      "id": "aa11bb22-cc33-4d44-8e55-6f7788990011",
      "reference": "BR-000318",
      "type": "REGIONAL",
      "message": "Note: the Ikeja depot closes at 4pm on Friday.",
      "targetRegions": ["LAGOS"],
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

An out-of-region broadcast must not appear here even when `search` matches its
message.

### 3.2 `GET /api/v1/admin/product-flyers` as a regional admin (RF-1)

Unchanged from the admin response under reading **(a)**:

```json
[
  {
    "id": "3f0a1b2c-4d5e-4f60-9a1b-2c3d4e5f6071",
    "name": "August promo",
    "imageUrl": "https://res.cloudinary…/flyers/august.jpg",
    "description": "Buy 10 cartons, get 1 free.",
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2026-08-01T09:00:00.000Z",
    "updatedAt": "2026-08-20T11:12:00.000Z"
  }
]
```

Under reading **(b)** each row would additionally carry
`"region": "LAGOS" | null`, and a regional admin's `POST` would set it from
their token.

### 3.3 The three 403 shapes we branch on

The portal renders the API's own `message`, so these only need a stable `code`:

```json
{ "message": "You can only broadcast to your own region.", "code": "REGION_NOT_ALLOWED", "statusCode": 403 }
```

```json
{ "message": "A regional admin cannot create an administrator.", "code": "ROLE_NOT_ALLOWED", "statusCode": 403 }
```

```json
{ "message": "No region is set on your account.", "code": "REGION_NOT_SET", "statusCode": 403 }
```

`REGION_NOT_SET` is already handled — `isRegionNotSetError` renders it as an
account-configuration problem rather than an empty region — so please keep
using it for an unconfigured regional admin on any of these routes.

---

## 4. One open question from an earlier round — ANSWERED

**RA-O1 is closed.** May a `REGIONAL_ADMIN` send `region` on
`GET /admin/officers`?

**Yes — it is accepted and ignored;** the region always comes from the token.
So the Officers screen may keep sending it and the Users screen may send it
too: both are safe, neither can widen scope, and the response is identical
either way.

This deliberately differs from `GET /admin/customers`, where a `region` from a
regional admin is a hard `403 REGION_NOT_ALLOWED`. The inconsistency is
pre-existing and both routes were left alone on purpose — changing the
customers route would break a working screen, and changing this one would break
the officers screens. Nothing leaks either way, since scope is read from the
token on both. Recorded in `GetOfficersParams.region` so the next person to
find it does not "fix" one of them.
