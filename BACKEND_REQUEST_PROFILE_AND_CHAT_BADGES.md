# Backend Request — Profile Self-Service, Chat Badges & the Description Timestamp

**Raised by:** Frontend (Viju Customer Portal — all staff roles)
**Date:** 28 Aug 2026
**Feature spec:** `context/feature-spec/42-many-corrections04.md`
**Related:** `BACKEND_REQUEST_CHAT_LIST_AND_CANCEL_WINDOW.md` (CH-1..CH-3, L-2), `documents/FRONTEND_GUIDE_SENDER_ROLE_AND_NOTIFICATIONS.md` (N-1)

> **STATUS: CLOSED — all five answered and integrated, §4 answered.**
> See **§0a Resolution**.
>
> *(Original status: OPEN.)*
>
> Spec 42 has six items. Four are done with nothing needed from you — the chat
> unread badges, the notification suppression, the customers page, and the
> client-side magic-number check.
>
> The five asks below are: **two routes that do not exist** (PR-1, PR-2), **one
> field that does not exist** (TS-1), **one server-side check to match a
> client-side one** (PR-3), and **one cleanup that would make a badge exact
> again** (NB-1).
>
> **PR-1 and PR-2 are blocking** — there is no way to set a profile picture or
> change a password from inside the portal at all today. The other three are
> not.

The **Example Response** column shows the body each endpoint should return at
the shape the UI already binds to. Full pretty-printed versions are in **§3**.


---

## 0a. Resolution — all five answered, §4 answered

**Answered:** `documents/FRONTEND_GUIDE_PROFILE_AND_CHAT_BADGES.md` (backend branch `dev`)
**Frontend integrated:** 28 Aug 2026
**Needs `prisma migrate deploy`** — two nullable columns.

| # | Outcome | What changed on the frontend |
|---|---|---|
| **PR-1** | **Done.** `PATCH /users/profile/photo`, token's own account, answers the refreshed profile. The URL is checked against this deployment's own upload hosts (`INVALID_UPLOAD_URL`), and `http://` is refused so a viewer's connection cannot be downgraded. | Nothing — the page worked on deploy. Staff had **no column at all** before this; `GET /users/me` returned a hard-coded null for them. |
| **PR-2** | **Done.** `PATCH /users/profile/password`, current password compared before anything is written, both codes as specified — **and each carries `field`**. | The code→field map is now the FALLBACK; `field` is read first. New `NO_PASSWORD_SET` is handled as its own case: an ERP-mirrored account has no password to prove knowledge of, so it points at the reset flow instead of at a box retyping cannot fix. |
| **PR-3** | **Done.** Magic-number sniffing on image folders; `waybill-documents` and `misc` still take PDFs. Both compound checks are tested — a `.wav` is also `RIFF`, an `.mp4` is also `ftyp`. | Nothing. The client check **stays**: it fails faster and explains itself better. It is now the fast path in front of a real control rather than the only thing standing there. |
| **TS-1** | **Done.** `descriptionUpdatedAt` on all four routes and the PATCH response; set on write, cleared on clear, **never touched by a status change** — verified with a status move that left it untouched. | Nothing — the UI was written to render it on arrival. |
| **NB-1** | **Done, and more than asked.** `CHAT_MESSAGE` is excluded from a staff caller's `data` **and** `unread`. `markAllRead` skips it too, so "mark all read" clears what the bell actually showed. | **Both the filter and the recount are deleted** — see below. |
| **§4** | **Answered: sessions are NOT invalidated.** Refresh tokens untouched on every device; asserted by a test. | The form says nothing about other devices and does not sign the session out. The success notice now says "you are still signed in here", and the comment records where a warning would go if that ever changes. |

### NB-1 — the recount went, which was the actual fix

The client-side filter was the obvious half. The half that mattered was the
**badge recount**: because `unread` and `data` are now filtered by the SAME
predicate server-side, the badge is exact regardless of pagination, so
`useNotifications` reads the server's `unread` directly again.

The interim recount was exact on page one and an undercount past it. That is
precisely why this was worth asking for rather than living with — a client
cannot count what it has not fetched.

Two decisions behind the answer, both worth keeping in mind:

- **Filtered on read, not by refusing to write.** We had offered "stop writing
  them if nothing else consumes them" — something does. The row drives the push
  dispatch and the realtime frame, so not writing it would have silently killed
  staff chat pushes as well.
- **The distributor's feed is untouched**, as framed. A customer keeps every
  chat notification; the mobile app has no badge to replace them with.

### Things we did NOT change, deliberately

| Finding | Decision |
|---|---|
| Existing loading notes read back `descriptionUpdatedAt: null` — they predate the column and were **not** back-filled from `updatedAt` | Correct, and the UI already renders nothing for them. Back-filling would stamp each note with the time of some unrelated status change, which is the exact wrong answer the column exists to avoid. They pick up a real stamp on the next edit. |
| A **corrupt** file that passes the signature check surfaces as a 500 from Cloudinary rather than a 400 | Left alone. It predates this work, affects `waybill-documents` equally, and PR-3 makes it rarer since renamed files no longer reach Cloudinary. Worth turning into a 400 eventually — noted, not requested. |
| PR-1 accepts `null`/`""` to clear a picture | Not surfaced. Spec 42 asked for upload, not removal; the capability is there when it is asked for. |

---

## 0b. §8 — the stranded officers they noticed

Not part of spec 42, and worth reading. While verifying, the backend found two
officers sitting outside the region their customers are in:

```
6 LAGOS customers   -> officer.lagos1@viju.local   (now region SOUTH_SOUTH)
2 WESTERN customers -> officer.western1@viju.local (now region LAGOS)
```

That is the O-1 / O-2 region edit from spec 40 **working as designed** — an
admin can move an officer — but nothing warned that doing so strands the book
they hold. Those 8 customers now have an officer that
`PATCH /admin/customers/{id}/reassign` would refuse to assign, because that
route requires the officer to be in the **customer's** region.

**What we changed:** the two single-officer paths now warn, which the bulk
modal has done since spec 39 and these had not:

- `EditUserModal` — a line under the region picker
- `OfficerDetailsModal` — a line under the pen-icon picker, naming the number
  of customers at stake, shown only when they actually hold some

**What is still open, and is a product decision rather than ours:** should
moving an officer who holds customers be *refused* with a 409 the way
deactivation is (`OFFICER_HAS_CUSTOMERS`), or should it move the portfolio with
them? The backend has offered to implement either. A warning is the honest
minimum; it is not a fix, and the 8 live records are still stranded.

---

## 0c. Summary as raised

*Kept as written. Every row is now **done** — see §0a.*

| # | Item | Frontend at time of asking | Blocking? |
|---|---|---|---|
| **PR-1** | Set your own profile photo | Page built, `PATCH /users/profile/photo` 404s | **YES** |
| **PR-2** | Change your own password with the current one | Form built, `PATCH /users/profile/password` 404s | **YES** |
| **PR-3** | Server-side magic-number check on image uploads | Client checks; the API is bypassable | No — but it is the only real control |
| **TS-1** | `descriptionUpdatedAt` on a loading request | The line is not rendered at all | No — the feature is invisible without it |
| **NB-1** | Stop returning `CHAT_MESSAGE` notifications to staff | Filtered client-side; the badge is recounted per page | No — the badge undercounts on a busy account |

---

## 1. The requests

| Issues Description | Endpoint Available | Update Endpoint | Proposed Endpoint | Description | Example Response |
|---|---|---|---|---|---|
| **PR-1 — staff cannot set a profile picture.** Spec 42 asks for the account officer, loading officer and regional admin to upload one. `CurrentUser.profilePhotoUrl` already exists on `GET /users/me` and is rendered wherever it is set, but nothing can write it. | NO | N/A | `PATCH /api/v1/users/profile/photo` | Body `{ "profilePhotoUrl": string }`, acting on the **token's own account** — never an id in the path, so one staff member cannot set another's picture. Two steps deliberately: the frontend `POST /uploads?folder=profile-photos` first (reusing the pipeline and its Cloudinary handling) and sends the returned URL here, rather than adding a second multipart route. Please **answer the refreshed profile**, so the new photo can be folded into the session without a second read — the avatar appears in the navbar and the sidebar and should change immediately. Please also **reject a URL that is not from our own upload host**: this field is rendered in an `<img>` for every viewer of that user, and accepting an arbitrary URL turns it into an SSRF/tracking vector. `null` should be accepted to clear the picture. | `{ "id": "…", "name": "Ada Obi", "role": "OFFICER", "region": "LAGOS", "profilePhotoUrl": "https://res.cloudinary…/profile-photos/x.png" }` |
| **PR-2 — staff cannot change their own password.** Spec 42 asks for a current / new / confirm flow, explicitly **not** the forgot-password flow. There is no route for it: `/auth/staff/password-reset/*` proves control of an inbox, which is a different question from proving knowledge of the password. | NO | N/A | `PATCH /api/v1/users/profile/password` | Body `{ "currentPassword": string, "newPassword": string }`, on the token's own account. **`currentPassword` must be compared against the stored hash before anything is written** — that is the whole point of the flow, and it is what makes it safe to expose on a signed-in session that may have been left open. `confirmNewPassword` is validated in the form and deliberately **not sent**; the server has no use for a value whose only job is catching a typo. Please return **400 `INVALID_CURRENT_PASSWORD`** when it does not match, and **400 `PASSWORD_REUSED`** if the new password equals the current one — both are rendered against the field they belong to rather than as a toast, so the person can see which of the three boxes to correct. Validation should match `POST /admin/officers` (8–72 characters). Please say whether existing sessions are invalidated: if the user is signed out elsewhere, we should tell them so before they submit. | `{ "success": true, "message": "Password changed" }` |
| **PR-3 — the image type check is only client-side.** The frontend reads the first bytes and matches the container signature for JPEG, PNG, WEBP and AVIF, refusing anything else. That is a usability guard, not a control: anything client-side can be bypassed by calling `POST /uploads` directly. | YES | YES | N/A — add the same check to `POST /api/v1/uploads` for image folders | Please sniff the **magic number** server-side rather than trusting the `Content-Type` header or the filename, and reject anything that is not JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WEBP (`RIFF`…`WEBP` at byte 8) or AVIF (`ftyp` at byte 4 with an `avif`/`avis` brand). A renamed PDF or an SVG carrying a script currently reaches storage and is then served back to every viewer of that profile. Suggested code `UNSUPPORTED_IMAGE_TYPE`, so it can be told apart from a size failure. The `folder` already distinguishes image folders (`profile-photos`, `product-flyers`, `chat-attachments`) from `waybill-documents`, which legitimately accepts PDFs — please keep that distinction rather than applying one rule to all. | `{ "message": "That file is not a JPG, PNG, WEBP or AVIF image.", "code": "UNSUPPORTED_IMAGE_TYPE", "statusCode": 400 }` |
| **TS-1 — a loading description has no timestamp.** Spec 42 asks the loading officer's description to show when it was last updated. `PATCH /loading/queue/{id}/description` (L-2) answers the full assignment detail, but the only timestamp on it is `updatedAt`, which every status change also bumps. | YES | YES | N/A — add `descriptionUpdatedAt` to the loading request projection | A nullable `descriptionUpdatedAt`, set whenever `description` is written and **left alone by a status change**, returned on `GET /loading/queue`, `GET /loading/queue/{id}`, `GET /regional/loading-requests` and `GET /officers/loading-requests`. `updatedAt` is deliberately not used as a stand-in: on a completed load it would date the note to the moment the load finished, and the whole value of the note is *when the count was taken* — a wrong timestamp on a handover note is worse than none. **The UI is already written and renders nothing until this field arrives**, so no frontend change is needed when it does. Clearing the description (an empty string is a valid save under L-2) should set this to null alongside it. | `{ "id": "…", "description": "customer loading 800 cartons…", "descriptionUpdatedAt": "2026-08-28T09:14:02.000Z", … }` |
| **NB-1 — chat notifications are still written for staff.** Spec 42 says the bell must not show chat messages: the unread badge on the Chat sidebar entry and the per-conversation count already say it twice, and a third copy in the panel buried assignments and tickets. | YES | YES | N/A — stop writing/returning `CHAT_MESSAGE` to staff on `GET /api/v1/notifications/me`, **or** accept `?excludeTypes=CHAT_MESSAGE` | Either is fine; stopping the write is cleaner if nothing else consumes those rows. **The reason this is worth doing rather than leaving to the client:** the panel is paginated, so filtering client-side means the badge has to be recounted from the fetched page, and a user with more than one page of unread notifications now sees the page's figure instead of the true total. The alternative — rendering the server's `unread` unchanged — would show a bell reading 4 above a list of one, which is worse. Please confirm the **distributor's own feed keeps its chat notifications**: this is a staff-portal concern only, and the mobile app has no equivalent badge to replace them with. | `{ "unread": 2, "data": [ … no CHAT_MESSAGE rows … ], "meta": { … } }` |

---

## 2. What the frontend already does, so the assumptions are checkable

None of this needs a change from you.

| Surface | Behaviour |
|---|---|
| **Chat badges** | Sidebar total comes from the officer dashboard's `unreadMessages`; the per-conversation count from `GET /officers/chats`. Both are invalidated on the `chat.message` SSE frame, so they move live. |
| **The open conversation** | Netted out of BOTH badges while it is on screen — it is read the moment a message lands, and waiting for the read round trip would flash a count for a message already visible. |
| **Notifications** | `CHAT_MESSAGE` filtered out, badge recounted from the surviving rows. Removed entirely by **NB-1**. |
| **Customers** | The Total Customers tile now opens `/customers` for an ADMIN and a REGIONAL_ADMIN. Same table, same routes, same filters — only the container changed. The officer keeps the dialog. |
| **Image uploads** | Header bytes sniffed before upload; a renamed file is refused with a message that says renaming does not change the format. Reinforced, not replaced, by **PR-3**. |
| **Profile page** | Open to every signed-in role, not just the three the spec names — an admin has a picture and a password too. Both routes act on the token's own account. |

---

## 3. Example responses, pretty-printed

### 3.1 `PATCH /api/v1/users/profile/photo` (PR-1)

Request:

```json
{ "profilePhotoUrl": "https://res.cloudinary.com/…/profile-photos/ada.png" }
```

Response — the refreshed profile, same shape as `GET /users/me`:

```json
{
  "id": "1b2c3d4e-5f60-4718-9a2b-3c4d5e6f7081",
  "name": "Ada Obi",
  "role": "OFFICER",
  "email": "ada.obi@viju.ng",
  "phone": "+2348012345678",
  "region": "LAGOS",
  "isActive": true,
  "lastLoginAt": "2026-08-28T07:15:44.000Z",
  "profilePhotoUrl": "https://res.cloudinary.com/…/profile-photos/ada.png"
}
```

### 3.2 `PATCH /api/v1/users/profile/password` (PR-2)

Request:

```json
{ "currentPassword": "…", "newPassword": "…" }
```

Success:

```json
{ "success": true, "message": "Password changed" }
```

The two failures we branch on:

```json
{ "message": "Your current password is not correct.", "code": "INVALID_CURRENT_PASSWORD", "statusCode": 400 }
```

```json
{ "message": "The new password must be different from your current one.", "code": "PASSWORD_REUSED", "statusCode": 400 }
```

### 3.3 A loading request with TS-1

```json
{
  "id": "f6559538-0e59-48cd-a1ae-b9bba22a606a",
  "waybill": "SEED-WB-10110003-01",
  "distributorName": "ADLAK",
  "status": "IN_PROGRESS",
  "description": "customer loading 800 cartons on 26/08/2026, remaining a balance of 200 cartons",
  "descriptionUpdatedAt": "2026-08-28T09:14:02.000Z",
  "cancelledAt": null,
  "cancelReason": null,
  "updatedAt": "2026-08-28T11:41:12.004Z"
}
```

Note `descriptionUpdatedAt` and `updatedAt` differ here on purpose — that gap
is exactly why the second cannot stand in for the first.

---

## 4. One question on PR-2 — ANSWERED

> **Does changing a password invalidate other sessions?**

**No. Nothing is signed out** — refresh tokens are untouched on this device and
every other one, and that is asserted by a test so it will not change silently.

So the form says nothing about other devices and does not sign the current
session out; the success notice confirms "you are still signed in here". The
comment in `app/profile/page.tsx` records where the warning would go if the
behaviour is ever revisited.

The backend offered the alternative — refresh tokens are already stored per
device and the deactivation path already revokes them — and deliberately did
not implement it unasked, on the grounds that signing someone out of their
phone for changing a password on their laptop is a surprise. Agreed. If the
client wants that instead, it is a small change on both sides.
