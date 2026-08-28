# Backend Request — Who Cancelled a Load, and Bulk Actions for a Regional Admin

**Raised by:** Frontend (Viju Customer Portal — Admin, Regional Admin, Account Officer & Loading Officer Web)
**Date:** 28 Aug 2026
**Feature spec:** `context/feature-spec/43-many-corrections05.md`
**Related:** `BACKEND_REQUEST_REGIONAL_ADMIN_PARITY.md` (§6, RU-3), `BACKEND_REQUEST_REGION_EDITING_AND_LOADING_FLOW.md` (L-1, O-2, C-2)

> **STATUS: CLOSED — CB-1 and BA-2 implemented, BA-1 REFUSED and agreed.**
> See **§0a Resolution**.
>
> *(Original status: OPEN.)*
>
> Spec 43 has twelve items. Nine are done with nothing needed from you.
>
> Three need something: **one field that does not exist** (CB-1), and **two
> routes that must accept a role you explicitly reserved to an ADMIN four specs
> ago** (BA-1, BA-2).
>
> ⚠️ **BA-1 and BA-2 contradict a decision you made in spec 40**, and one of
> them contradicts RU-3 outright. We have built the UI as spec 43 asks and are
> flagging the conflict rather than quietly picking a side — please read §0
> before implementing.

The **Example Response** column shows the body each endpoint should return at
the shape the UI already binds to. Full pretty-printed versions are in **§3**.


---

## 0a. Resolution — two implemented, one refused

**Answered:** `documents/FRONTEND_GUIDE_CANCELLED_BY_AND_REGIONAL_BULK.md` (backend branch `dev`)
**Frontend integrated:** 28 Aug 2026
**No migration** — CB-1 is a batched lookup on the existing `cancelledById`, not a column.

| # | Outcome | What changed on the frontend |
|---|---|---|
| **CB-1** | **Done.** `cancelledBy: { id, name, role }` on every loading-request row and both cancel responses, `role` as the wire enum. | Nothing — the column was written to render it on arrival. The **fallback comment was corrected**: nulls are not "everything before CB-1", they are the small set predating L-1 plus any id that stops resolving. |
| **BA-2** | **Done.** `REGIONAL_ADMIN` allowed, scoped on both sides. | Nothing behavioural. The two failure shapes are now documented where the call is made — see below. |
| **BA-1** | **REFUSED, and agreed.** `bulk-region` stays ADMIN-only. | **The control is gated back to an ADMIN.** On `/regional-admin/officers` that means it is effectively absent, which is the honest outcome. |

### BA-1 — the pushback was accepted, so the UI follows

We asked the backend not to agree silently. They didn't — they refused, and
for the reasons we gave: source-scoped is RU-3's refusal at scale, confined is
a no-op, and there is no third reading.

They added one we had only gestured at: the two officers already stranded on
the live database got there **one at a time** through the single-officer region
edit. BA-1 would let that happen 500 at a time.

So the control is now gated on `canBulkReassignOfficerRegion` (ADMIN only)
rather than left visible to 403. The guide said "your UI is fine as built, the
403 surfaces" — we disagree, mildly: **a button that can never work for the
person looking at it is not a feature, it is a defect with a tooltip.** It is
left wired rather than deleted, because an ADMIN can reach that URL and because
a *safe* version of the feature may yet be wanted there.

**Spec 43's requirement is therefore not met, deliberately**, and that is a
client conversation rather than something to paper over. The safe alternatives
the backend named — bulk deactivate, bulk reassign a portfolio — do not involve
giving staff away and would satisfy "a regional admin can bulk-manage their own
officers" if that is what was actually wanted.

### BA-2 — two failure shapes, and they are not symmetrical

Worth knowing, because it is easy to assume one envelope:

- **The receiving officer is checked ONCE.** Naming one outside the region
  means the call is wrong, not that eighty items each failed identically — so
  it is a **403 that writes nothing**, and reaches `onError`, not `failed[]`.
  The modal stays open with the selection intact, so another officer can be
  picked.
- **Each customer is checked per item**, so a partly-valid selection still
  moves what it can. That is what the envelope is for.

One correction absorbed: an out-of-region **customer** answers
`REGION_NOT_ALLOWED` for a regional admin but `OFFICER_NOT_FOUND` for an ADMIN
— the failures genuinely differ ("that distributor is not yours" versus "this
officer is not valid for this customer"). Nothing here branches on the code,
since the API's own `message` is what gets rendered, but the asymmetry is now
recorded in `customerService.bulkReassign` so anything that ever does branch
handles both.

### Still open — and now blocking BA-1 rather than merely adjacent

The **stranded officers** are unresolved for a third round. The backend has
proposed the fix and is waiting to be asked: moving an officer who holds
customers refuses with **409 `OFFICER_HAS_CUSTOMERS`**, the way deactivation
already does — a small, contained change to the single-officer route.

They will not do it unasked, since it changes shipped behaviour. Our two
region-change warnings (spec 42) are the honest minimum and not a fix; the 8
live records are still stranded, and their officers cannot be reassigned to
those customers at all.

---

## 0b. The conflict as raised — RESOLVED, see §0a

*Kept as written. The backend refused BA-1 on exactly these grounds and
implemented BA-2.*

Spec 40 asked whether a `REGIONAL_ADMIN` should get the bulk routes. Your
answer (`FRONTEND_GUIDE_REGIONAL_ADMIN_PARITY.md` §6) was:

> `DELETE /admin/officers/{id}` and `PATCH /admin/officers/{id}/reassign-customers`,
> plus the two bulk routes (`officers/bulk-region`, `customers/bulk-reassign`),
> remain organisation-wide operations. **Hide them for this role.**

We did. **Spec 43 now asks for both to be given to a regional admin.** Worse,
one of them is not just an authorisation question:

> **RU-3:** *"`region` is refused rather than ignored... moving a user out is a
> transfer into someone else's scope that the receiving region's admin has not
> agreed to."*

`PATCH /admin/officers/bulk-region` **is** that transfer, in bulk. A regional
admin using it would move officers **out of their own region** — losing them
from their own scope, and pushing them into another admin's without asking.
That is precisely the thing RU-3 refuses one at a time.

**What we have done:** built both controls exactly as spec 43 specifies, so the
requirement is met and visible. Until you act on BA-1/BA-2 they will answer 403
for a regional admin, and the UI reports the failure rather than swallowing it.

**What we would like from you:** not silent agreement. If RU-3's reasoning
still holds — and we think it does — say so, and we will take it back to the
client rather than implement a rule that lets a regional admin give their staff
away. If the client genuinely wants it, **BA-1 needs a scope decision** (see
the row), because "a regional admin may move officers to any region" and "a
regional admin is confined to their own region" cannot both be true.

BA-2 is far less troubling: assigning customers to an officer **within** a
region is squarely inside a regional admin's remit, and the picker is already
region-scoped, so we would happily see that one land on its own.

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **CB-1 — a cancelled load does not say who cancelled it.** Spec 43 adds a `CANCELLED BY` column to the loading request table for both the regional admin and the account officer. `cancelledAt` and `cancelReason` exist (L-1), but not the actor — and three different roles can cancel, so "cancelled" alone does not say who to ask about it. | YES | YES | N/A — add `cancelledBy` to the loading request projection | A nullable `cancelledBy: { id, name, role }` on every loading-request row: `GET /loading/queue`, `GET /loading/queue/{id}`, `GET /regional/loading-requests`, `GET /officers/loading-requests`, and both `/cancel` responses. `role` should be the **wire enum** (`OFFICER`, `REGIONAL_ADMIN`, `LOADING_OFFICER`) — never display text; the portal renders it through `formatRole()` so it reads "Account Officer" and not "OFFICER". The role matters as much as the name: "who do I ask about this" has a different answer for a loading officer at the depot than for the regional admin who overruled them. **Rows cancelled before this lands** should keep `cancelledBy: null` rather than being back-filled with a guess — the UI renders a plain "Cancelled" for those, which is honest. | `{ "status": "CANCELLED", "cancelledAt": "…", "cancelReason": "distributor rescheduled", "cancelledBy": { "id": "…", "name": "Ada Obi", "role": "REGIONAL_ADMIN" } }` |
| **BA-1 — `PATCH /admin/officers/bulk-region` is ADMIN-only.** Spec 43 asks for it on `/regional-admin/officers`. **Please read §0 first.** | YES | YES — **but see §0** | N/A — widen authorisation on `PATCH /api/v1/admin/officers/bulk-region` | If this is genuinely wanted, it needs a scope rule, because the obvious two both have problems. **(a) Source-scoped:** a regional admin may bulk-move officers who are currently in *their* region, to any region. That lets them give staff away to a region whose admin never agreed — exactly RU-3's objection, at scale. **(b) Confined:** they may only move officers *within* their own region — which is a no-op, since the officers are already there. We cannot see a third reading that is both useful and safe, which is why we would rather you pushed back than implemented (a). If you do implement something, please keep the per-officer `failed[]` envelope unchanged; the UI already reads it. | `{ "succeeded": ["…"], "failed": [{ "officerId": "…", "code": "REGION_NOT_ALLOWED", "message": "…" }] }` |
| **BA-2 — `PATCH /admin/customers/bulk-reassign` is ADMIN-only.** Spec 43 asks for it on `/regional-admin/distributors`. | YES | YES | N/A — widen authorisation on `PATCH /api/v1/admin/customers/bulk-reassign` | Allow `REGIONAL_ADMIN`, **scoped to their own region on both sides**: every `customerId` must be a customer in their region (403 otherwise), and `newOfficerId` must be an officer in it. That is the same rule the single route already enforces — it requires the officer to be in the **customer's** region (C-1) — so this is the existing check applied per item rather than a new one. **This one we are comfortable with:** moving customers between officers inside a region is squarely a regional admin's job, and the officer picker in the UI is already region-scoped, so a valid selection is all they can build. Per-customer `failed[]` unchanged; `ALREADY_ASSIGNED` still counts as a success. | `{ "succeeded": ["…"], "failed": [{ "customerId": "…", "code": "OFFICER_NOT_FOUND", "message": "…" }] }` |

---

## 2. What the frontend does today

*Updated after §0a: the regional bulk officer control is gated to an ADMIN
rather than left to 403.*

| Surface | Behaviour |
|---|---|
| `CANCELLED BY` column | Renders `"Account Officer - Musa Bello"` from `cancelledBy`. With the field absent it falls back to a plain `"Cancelled"` on a cancelled load, and `"-"` otherwise — never a guess at who. |
| `DESCRIPTION` column | The loading officer's note, or — once a load is cancelled — the `cancelReason` the canceller gave. The officer's note wins if a row somehow has both, since it records what physically happened. |
| `ACTION` column | `Assign Officer` on a PENDING load, `Cancel` on one that has not started, `-` once it is finished or cancelled. The separate `CANCEL` column is gone. |
| Regional bulk CUSTOMER assignment | Live for a `REGIONAL_ADMIN` (BA-2). A wrong receiving officer rejects the whole call and reaches the error toast; out-of-region customers come back per item. |
| Regional bulk OFFICER region change | **Gated to an ADMIN** after BA-1 was refused, so it is absent on `/regional-admin/officers`. Left wired for an admin reaching that URL, and for a safe replacement feature. |

---

## 3. Example responses, pretty-printed

### 3.1 A cancelled loading request with CB-1

```json
{
  "id": "c675a746-7cc1-4231-a0d5-455d5c451008",
  "waybill": "SEED-WB-10110017-02",
  "distributorName": "ISEA INTEGRATED",
  "truckPlateNumber": "LAG-168-XY",
  "driverName": "Emeka Obi",
  "driverPhone": "+2348056789012",
  "status": "CANCELLED",
  "description": null,
  "descriptionUpdatedAt": null,
  "cancelledAt": "2026-08-28T11:34:41.751Z",
  "cancelReason": "distributor rescheduled",
  "cancelledBy": {
    "id": "1b2c3d4e-5f60-4718-9a2b-3c4d5e6f7081",
    "name": "Ada Obi",
    "role": "REGIONAL_ADMIN"
  },
  "assignedOfficer": null
}
```

`role` is the enum. A load cancelled by the assigned loading officer carries
`"role": "LOADING_OFFICER"` and their own name — which is the case the column
exists for, since it is the only way to tell an overruled load from an
abandoned one.

### 3.2 A live load

```json
{
  "status": "ASSIGNED",
  "cancelledAt": null,
  "cancelReason": null,
  "cancelledBy": null
}
```

---

## 4. Two smaller notes

**`driverPhone` is already on the wire** and simply was not rendered — spec 43
asks for it on the loading request table and the loading officer's detail
panel, and both now show it. Nothing needed from you; recorded so it is not
mistaken for a new field.

**The stranded officers from the last round are still stranded.** The §8 finding
in `FRONTEND_GUIDE_PROFILE_AND_CHAT_BADGES.md` — two officers sitting outside
their customers' region — is unresolved, and BA-1 would make that class of
problem easier to create in bulk rather than harder. Whatever is decided there
should probably be decided before BA-1, not after.
