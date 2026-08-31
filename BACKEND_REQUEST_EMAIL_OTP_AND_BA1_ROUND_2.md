# Backend Request — Email OTP for Staff Reset, and BA-1 Reopened

**Raised by:** Frontend (Viju Customer Portal — all staff roles)
**Date:** 31 Aug 2026
**Feature spec:** `context/feature-spec/44-many-corrections06.md`
**Related:** `BACKEND_REQUEST_CANCELLED_BY_AND_REGIONAL_BULK.md` (BA-1), `documents/FRONTEND_GUIDE_CANCELLED_BY_AND_REGIONAL_BULK.md` (§2)

> **STATUS: OPEN.**
>
> Spec 44 has five items. Three are done with nothing needed from you — the
> modal width, the `CANCELLED AT` column, and the new `RoleProtectedRoute`.
>
> Two need something:
>
> - **EM-1** — confirm (or implement) that the staff password-reset OTP is
>   delivered by **email**. The frontend has always sent an email address here;
>   what we have never had in writing is where the code goes.
> - **BA-1 round 2** — the client has asked a second time for a regional admin
>   to bulk-reassign officer regions. **You refused this last round and we
>   agreed with you.** §0 is what changed and what did not.

---

## 0. BA-1, reopened — read this before implementing anything

Last round you refused `PATCH /admin/officers/bulk-region` for a
`REGIONAL_ADMIN`, and we said we agreed. Nothing about the reasoning has
changed. What has changed is that **the client has asked for it again**, in
spec 44, having seen it removed.

We are treating that as their decision to make, so **the control is switched
back on in the UI** — and it will 403 for a regional admin until you act. That
is a deliberately visible state rather than a hidden one.

**We are not asking you to reverse yourself on our say-so.** Your objection
still stands and we still think it is right:

> "Source-scoped" lets a regional admin empty their own region into one whose
> admin never agreed to receive the staff. "Confined to my own region" is a
> no-op. There is no third reading.

So the ask is narrower than "please implement BA-1":

1. **If your position is unchanged, say so again in writing.** We will take the
   refusal back to the client with both rounds attached, which is a stronger
   argument than one round.
2. **If the client's repeated request should win**, we need the scope rule
   spelled out, because we still cannot see a safe one — and if it is
   "source-scoped", please say explicitly that you accept a regional admin can
   transfer staff out of their own region without the receiving region
   agreeing. We would rather that were written down than assumed.
3. **Either way, the safe alternatives you named are still on the table** —
   bulk deactivate, or bulk reassign a portfolio. If one of those is what the
   client actually wants, it is a better question to put to them than a yes/no
   on BA-1, and we would happily build it instead.

### The blocker under the blocker

The **stranded officers are unresolved for a fourth round.** You proposed the
fix and said you would not change shipped behaviour unasked:

> moving an officer who holds customers refuses with `409 OFFICER_HAS_CUSTOMERS`,
> the way deactivation already does.

**Consider this the ask.** It is a contained change to the single-officer
route, it fixes a live data problem, and it makes the BA-1 question much
simpler to answer — a bulk route that inherits that refusal cannot create the
stranded state in the first place, which removes our strongest objection to it.

We would rather see that land than BA-1, and it may make BA-1 acceptable.

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **EM-1 — where does the staff reset OTP actually go?** Spec 44 asks for the forgot-password flow to use an **email** OTP rather than a phone number, for the admin, regional admin and account officer. The frontend has always sent an email address as `identifier` and its screens say "email" — but we have never had confirmation of what the server does with it, and if the code is going to a phone on the staff record then the flow is broken for anyone whose two do not match. | YES | Confirm, or update | N/A — `POST /api/v1/auth/staff/password-reset/request` | Please confirm the code is emailed to the address on the staff record, and that `identifier` is matched against **email only** for the four managed roles. If it currently resolves a phone number, or sends by SMS, please change it — the spec is explicit, and every screen in this flow already says "we sent a code to your email". Two behaviours worth stating either way: **(a)** an unknown identifier should answer **200**, not 404, so the endpoint cannot be used to enumerate which email addresses are staff; **(b)** please say what the expiry is, so the OTP screen can tell the user how long they have rather than leaving them to find out. A WAREHOUSE_OFFICER is ERP-mirrored and out of scope here — if they cannot use this flow at all, `NO_PASSWORD_SET` (the code PR-2 introduced) is the right refusal. | `{ "message": "If that email address belongs to a staff account, a reset code has been sent to it." }` |
| **BA-1 (round 2) — bulk officer region change for a REGIONAL_ADMIN.** Asked in spec 43, refused by you, asked again in spec 44. **Please read §0.** | YES | Your call — see §0 | N/A — `PATCH /api/v1/admin/officers/bulk-region` | Unchanged from round 1, so the detail is not repeated here. What we need is one of: a restated refusal we can take to the client; a scope rule if it is to be implemented; or a counter-proposal from the safe alternatives you named. **The `409 OFFICER_HAS_CUSTOMERS` fix on the single-officer route is the thing we would most like implemented**, independently of how BA-1 is decided — see §0. If BA-1 does land, keep the per-officer `failed[]` envelope; the UI already reads it and needs no change. | `{ "succeeded": ["…"], "failed": [{ "officerId": "…", "code": "REGION_NOT_ALLOWED", "message": "…" }] }` |

---

## 2. What the frontend does today

| Surface | Behaviour |
|---|---|
| Forgot password | Validates the input as an **email address** — a phone number is refused before the request leaves. The wire name stays `identifier`; only its meaning is pinned. |
| OTP screen | Names the address the code was sent to, so a mistyped one is spotted before the user sits waiting. Says to check spam. |
| Regional bulk officer reassignment | **On**, per spec 44. Will 403 until BA-1 is reopened; the failure surfaces through the existing per-officer reporting. |
| `RoleProtectedRoute` | New. An authenticated user whose role does not match a page is **signed out** and returned to login. Applied to every role-scoped page. |

### On `RoleProtectedRoute` — nothing needed from you, but worth knowing

Until now these pages relied on the sidebar not linking to them. An account
officer typing `/admin/users` reached the screen; your routes refused the data,
so they saw an error state rather than a table. That was your authorisation
working — but it presented as a broken page rather than a closed door.

The client now closes the door before the request. **This does not replace your
checks and is not treated as security** — it is a UI boundary sitting in front
of the real one, and every route should keep refusing exactly as it does now.
We mention it only so that a support report of "the app logged me out" has an
explanation on your side too.

---

## 3. Example responses, pretty-printed

### 3.1 `POST /api/v1/auth/staff/password-reset/request` (EM-1)

Request:

```json
{ "identifier": "ada.obi@viju.ng" }
```

Response — deliberately identical whether or not the address exists:

```json
{ "message": "If that email address belongs to a staff account, a reset code has been sent to it." }
```

The current copy on our side already assumes a code was sent, so a `200` with
this shape needs no frontend change. A `404` for an unknown address would need
one — and would make the endpoint an enumeration oracle, which is why we would
rather it did not.

### 3.2 What we would like to be able to say on the OTP screen

If you can tell us the expiry, this becomes possible:

```
We sent a 6-digit code to ada.obi@viju.ng.
It expires in 10 minutes.
```

Right now the screen says the code may take a minute and to check spam, which
is true but less useful than a deadline. A field on the request response
(`expiresInSeconds`) or simply a documented constant would both work.
