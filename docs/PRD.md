# JitzManager — Product Requirements Document

**Status:** Draft v1.0
**Date:** 2026-06-02
**Author:** Product (assessment + roadmap)
**Document type:** MVP assessment + multi-version PRD

---

## 1. Executive Summary

JitzManager is a multi-tenant SaaS for managing Brazilian Jiu-Jitsu academies. The current MVP is a solid, well-architected operational tool: student records, attendance check-in, weekly schedules, membership plans, integrated billing via Stripe Connect, digital waivers, public enrollment links, and a platform-billing layer so gyms pay to use the product. It is staff-facing and BJJ-specific.

To compete with **Gymdesk**, **Kicksite**, and **ZenPlanner**, JitzManager must close three strategic gaps:

1. **Member engagement** — there is no member-facing app/portal, no automated communications (email/SMS), and no lead/CRM pipeline. Competitors win and retain members here.
2. **Operational depth** — no class booking/capacity, no rank/curriculum tracking beyond a single belt+stripes field, no reporting/analytics, no point-of-sale.
3. **Extensibility** — BJJ belts are hardcoded; the product cannot yet serve other disciplines, multiple locations, or families/minors, which are table stakes for the broader martial-arts market.

This document audits the current build, benchmarks it against competitors, and lays out a four-release roadmap (v1.1 → v3.0) that takes JitzManager from "good BJJ admin tool" to "full martial-arts business platform."

---

## 2. Current State Assessment (MVP Audit)

### 2.1 Architecture (as built)

| Layer | Implementation |
|---|---|
| Frontend | React 18 + TypeScript + Vite, shadcn/ui (Radix), Tailwind |
| Data fetching | TanStack Query, Supabase JS client; query keys scoped by `organization.id` |
| Backend | Supabase Postgres + RLS (tenant isolation), Supabase Auth |
| Server logic | 26 Supabase Edge Functions (Deno) — all Stripe operations |
| Payments | Stripe Connect Express (gym→student) + platform subscriptions (gym→JitzManager) |
| Multi-tenancy | Every table carries `organization_id`; RLS pattern `organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())` |
| Hosting | Vercel (static SPA) |

**Assessment:** The foundation is sound. RLS-based isolation, edge-function-only secret handling, and a consolidated migration baseline are the right calls. Two architectural debts to note early:
- **Platform-admin access is hardcoded by email** (`thiago@reivien.com`) in RLS policies. This must become a role/claim before any second admin or investor demo.
- **No automated tests** anywhere in the repo. Every release below should add coverage; billing and RLS are the highest-risk areas.

### 2.2 Data model (current tables)

`organizations`, `profiles`, `membership_plans`, `schedules`, `students`, `attendance`, `payments`, `platform_subscriptions`.

Notable shape details:
- `students` holds belt, stripes, status (`trial`/`student`/`active`/`inactive`/`frozen`), membership status, Stripe customer/subscription IDs, address, freeze metadata, and waiver fields.
- `membership_plans.price` and `period` are **TEXT** (not numeric/enum) — fragile for reporting and proration.
- `schedules` are weekly recurring only (`day_of_week`, `start_time`, `end_time` as TEXT). No instances, capacity, or bookings.
- `attendance` is a flat check-in log; no relation to rank progress or class capacity.
- No tables for: leads, communications, rank history, curriculum, products/inventory, events, documents, locations, families.

### 2.3 Feature inventory (what exists today)

| Domain | Shipped |
|---|---|
| **Auth** | Gym login, platform-admin login, password recovery, onboarding flow, ProtectedRoute (unauth → login, no-org → onboarding) |
| **Students** | Directory, detailed profiles, CSV bulk import, belt + stripe edit, trial vs. student status, freeze, activation dialog |
| **Attendance** | Time-window-aware check-in that auto-detects the current class from the schedule |
| **Scheduling** | Weekly class schedule editor |
| **Memberships** | Plans (price/period/features), Stripe subscriptions, public per-plan signup links |
| **Billing** | Stripe Connect onboarding, charge saved card, payment methods, payment history, refunds, failed-payment retry + dashboard alert |
| **Waivers** | Per-gym waiver text, per-student token-based digital signing |
| **Staff** | Create/delete staff, role display, privilege-escalation guard |
| **Dashboard** | Student/active/new/trial stat cards; growth, revenue, attendance, belt-distribution charts |
| **Platform** | Admin dashboard, gym subscription billing, branding/theming, help center + docs, SEO landing page |

### 2.4 Honest gap list (vs. the category)

- ❌ No member-facing app or portal (members can't log in, book, or see progress)
- ❌ No lead capture / CRM / sales pipeline
- ❌ No automated communications (email, SMS, push, drip campaigns)
- ❌ No class booking, capacity limits, reservations, or waitlists
- ❌ No rank/promotion history, testing/requirements, or curriculum/technique library
- ❌ No reporting & analytics (retention, churn, LTV, attendance trends, exports)
- ❌ No point-of-sale / retail / inventory (pro shop, uniform orders)
- ❌ No events / competitions / seminars registration
- ❌ No families/households or minor+guardian support
- ❌ Single discipline only (BJJ belts hardcoded); no configurable rank systems
- ❌ No multi-location support within one organization
- ❌ No check-in kiosk / QR mode
- ❌ No integrations/API/webhooks/Zapier; no accounting export
- ❌ Platform admin not role-based; no test coverage

---

## 3. Competitive Analysis

### 3.1 What the incumbents offer

**Gymdesk** — Online + in-person kiosk signup, customizable ranks/levels with promotion criteria and readiness reports, QR check-in, automated billing with rebilling/dunning, built-in **point-of-sale with inventory and uniform orders**, automated email marketing, member portal, website-embeddable schedules/lead forms, data migration from competitors.

**Kicksite** — Belt/attendance tracking across disciplines, automated recurring billing with past-due visibility, **lead capture forms + landing pages**, email **and free unlimited SMS** with automated messaging flows for prospects, **member portal + mobile web app** (attendances, achievements, media library, manage payments, register & pay for events). Transparent tiered pricing: **$49 (≤25) / $99 (≤50) / $149 (≤100) / $199 (100+)** per month, all features at every tier.

**ZenPlanner** — Class scheduling + booking, **family memberships & family billing**, check-in kiosks, automated payments + revenue recovery, belt tracking with **example technique videos**, **member mobile app** (book classes, log workouts, view progress), and **ZenPlanner Engage** — a full CRM/marketing suite with 100+ templates and two-click campaigns. Starts ~$99/mo.

### 3.2 Feature matrix

| Capability | JitzManager (today) | Gymdesk | Kicksite | ZenPlanner |
|---|:--:|:--:|:--:|:--:|
| Student management | ✅ | ✅ | ✅ | ✅ |
| Attendance check-in | ✅ | ✅ | ✅ | ✅ |
| Recurring billing | ✅ | ✅ | ✅ | ✅ |
| Failed-payment recovery | ⚠️ basic | ✅ | ✅ | ✅ |
| Digital waivers | ✅ | ✅ | ✅ | ✅ |
| Belt + stripes | ✅ | ✅ | ✅ | ✅ |
| Configurable ranks (multi-discipline) | ❌ | ✅ | ✅ | ✅ |
| Promotion criteria / readiness | ❌ | ✅ | ⚠️ | ✅ |
| Curriculum / technique videos | ❌ | ❌ | ✅ media | ✅ |
| Lead capture / CRM | ❌ | ✅ | ✅ | ✅ Engage |
| Email automation | ❌ | ✅ | ✅ | ✅ |
| SMS | ❌ | ⚠️ | ✅ free | ✅ |
| Class booking / capacity / waitlist | ❌ | ⚠️ | ✅ | ✅ |
| Member app / portal | ❌ | ✅ | ✅ | ✅ |
| Family / household billing | ❌ | ✅ | ✅ | ✅ |
| Check-in kiosk / QR | ❌ | ✅ | ✅ | ✅ |
| Point-of-sale / inventory | ❌ | ✅ | ⚠️ | ⚠️ |
| Events / competitions | ❌ | ⚠️ | ✅ | ✅ |
| Reporting & analytics | ⚠️ dashboard | ✅ | ✅ | ✅ |
| Multi-location | ❌ | ✅ | ✅ | ✅ |
| Website / landing pages | ⚠️ links | ✅ | ✅ | ✅ |

**Takeaway:** JitzManager's billing and tenancy are competitive. The decisive deficits are **member-facing experience, communications/CRM, booking, and rank depth** — exactly where these tools justify their price and stickiness.

### 3.3 Positioning & differentiation

Rather than out-feature three mature suites, JitzManager should win on **BJJ-native depth + clean modern UX + transparent pricing**, then generalize:
- **BJJ-first credibility:** stripe-by-stripe promotion tracking, IBJJF-aware time/class-in-grade minimums, kids belt system (grey/yellow/orange/green), competition records. None of the generalists do BJJ as well as a focused tool can.
- **Modern UX:** competitors are widely described as powerful but dated. A fast, beautiful React UI is a wedge.
- **Then expand** to multi-discipline (Muay Thai, judo, karate, MMA) by generalizing the rank engine — reusing the same machinery.

---

## 4. Product Vision, Personas & Goals

### 4.1 Vision
> The system of record and engagement layer for grappling and martial-arts academies — running the front desk, the billing, and the student relationship from one place, with the best BJJ progression tracking in the market.

### 4.2 Personas
- **Owner/Head Instructor (primary buyer):** wants revenue visibility, retention, less admin. Cares about churn, failed payments, lead conversion.
- **Front-desk / Coach (primary daily user):** check-ins, promotions, attendance, day-to-day member ops. Needs speed and a kiosk.
- **Member / Student (engagement target):** wants to book classes, track progress, pay, register for events from their phone.
- **Parent/Guardian (minors):** manages a child (or several) — one login, family billing, sign waivers.
- **Platform operator (us):** onboard gyms, manage SaaS billing, monitor health, support.

### 4.3 Product goals & success metrics
| Goal | Metric | Target horizon |
|---|---|---|
| Reduce gym admin time | Avg. weekly active staff minutes ↓ | v1.x |
| Improve member retention for gyms | Member churn ↓, attendance frequency ↑ | v2.0 |
| Convert more leads | Lead→trial→member conversion tracked & ↑ | v2.0 |
| Reduce involuntary churn | Failed-payment recovery rate ↑ | v1.1 |
| Expand TAM | % non-BJJ gyms onboarded | v3.0 |
| Platform growth | Net-new gyms / mo, gym MRR retention | ongoing |

---

## 5. Release Roadmap Overview

| Release | Theme | Headline outcomes |
|---|---|---|
| **v1.1 — Hardening** | Make the MVP production-trustworthy | Numeric money, role-based admin, dunning, basic reports, tests |
| **v1.5 — Rank & Booking depth** | BJJ-native + class operations | Rank engine + promotion history, curriculum, class capacity/booking/waitlist, kiosk/QR |
| **v2.0 — Engagement** | Member app + CRM + communications | Member portal/PWA, lead pipeline, email/SMS automation, families |
| **v3.0 — Scale & Platform** | Multi-discipline, multi-location, commerce, ecosystem | Configurable disciplines, multi-location, POS/inventory, events, public API/integrations |

Each release is independently shippable and ordered so that foundational data-model work (e.g., numeric money in v1.1, rank engine in v1.5) precedes the features that depend on it.

---

## 6. v1.1 — Hardening (Foundation & Trust)

**Goal:** Eliminate correctness/scaling debt that would otherwise compound. Nothing flashy; everything load-bearing.

### 6.1 Features

**F1.1.1 — Numeric money & typed plans**
- Migrate `membership_plans.price` (TEXT) → `numeric(10,2)` + `currency`; `period` → enum (`weekly`/`monthly`/`quarterly`/`annual`). Backfill existing rows.
- Add `setup_fee`, `billing_day_of_month` to plans.
- *Why:* enables accurate revenue reporting, proration, and prevents string-math bugs.

**F1.1.2 — Role-based access (remove hardcoded admin email)**
- Introduce `platform_role` (claim or `platform_admins` table) and refactor RLS policies that check `thiago@reivien.com`.
- Formalize org roles: `owner`, `admin`, `coach`, `front_desk` with a permission map enforced in UI + RLS.

**F1.1.3 — Dunning / revenue recovery**
- Scheduled edge function (cron) to retry failed payments on a schedule (e.g., day 1/3/5/7), escalate to email, auto-freeze membership after final failure.
- "Past due" view listing every overdue invoice at a glance (matches Kicksite/Gymdesk table stakes).

**F1.1.4 — Reporting v1 & exports**
- Reports page: revenue (MRR, by plan), active/churned members, attendance trends, trial conversion. CSV export on every list.
- Persist a `revenue`/`invoices` representation suitable for monthly rollups.

**F1.1.5 — Audit log & test foundation**
- Add an `audit_log` (who changed what) for student/billing/role changes.
- Stand up the testing harness: unit tests for date/timezone + billing math, and RLS policy tests (critical-path tenant isolation).

### 6.2 Data model
- Alter `membership_plans` (numeric price, enum period, fees).
- New: `platform_admins`, `audit_log`. Optional `invoices` table to decouple reporting from raw Stripe events.

### 6.3 Acceptance criteria
- No RLS policy references a literal email.
- Revenue report totals reconcile to Stripe within rounding.
- A failed payment triggers the documented retry+notify+freeze sequence.
- RLS test suite proves a user in org A cannot read org B data.

---

## 7. v1.5 — Rank & Booking Depth (BJJ-native operations)

**Goal:** Differentiate on BJJ depth and turn the schedule into a real bookable class system. This is the wedge against generalist tools.

### 7.1 Features

**F1.5.1 — Configurable rank engine + promotion history**
- Replace the single `belt`/`stripes` field with a rank **system**: an ordered set of ranks per discipline (adult belts white→black with 0–4 stripes; kids belts grey/yellow/orange/green with bars).
- New `promotions` table records every promotion (date, from→to, awarded_by, notes). Student profile shows full belt timeline.
- **Promotion readiness:** define criteria per rank (min time-in-grade, min classes attended); dashboard flags who's eligible. (Gymdesk/ZenPlanner parity, BJJ-tuned.)

**F1.5.2 — Curriculum & technique library**
- Per-gym curriculum: techniques/positions grouped by rank, optional video URL/embed, mark techniques covered per class or per student. (Matches ZenPlanner technique videos / Kicksite media library.)

**F1.5.3 — Class instances, capacity & booking**
- Generate dated class **instances** from recurring `schedules` (+ one-off/cancelled overrides, holidays).
- Add capacity, instructor assignment, program/level restriction, and **reservations** with **waitlist** + auto-promote on cancellation.
- Attendance links to the booked instance (closes the loop with promotion criteria).

**F1.5.4 — Check-in kiosk & QR**
- Tablet kiosk mode (PIN or QR per member) for self-check-in at the front desk. Self-contained, fast, offline-tolerant.

**F1.5.5 — Programs**
- Introduce `programs` (e.g., Adult BJJ, Kids BJJ, No-Gi, Fundamentals); plans, schedules, ranks, and curriculum scope to a program.

### 7.2 Data model
- New: `rank_systems`, `ranks`, `student_ranks`/`promotions`, `programs`, `class_instances`, `bookings`, `waitlist_entries`, `curriculum_items`, `class_curriculum`.
- `attendance.class_instance_id` FK; migrate belt/stripes into the rank engine (keep a read view for back-compat).

### 7.3 Acceptance criteria
- A gym can define adult + kids belt systems and promote a student, with history retained.
- A class with capacity N accepts N bookings, then waitlists; a cancellation auto-promotes the first waitlisted member.
- "Eligible for promotion" list is accurate against configured criteria.

---

## 8. v2.0 — Engagement (Member App, CRM & Communications)

**Goal:** The retention/growth release. Give members their own experience and give owners the lead+communications machine the incumbents sell on.

### 8.1 Features

**F2.0.1 — Member-facing portal / PWA**
- Member auth (a `member` role linked to `students`). Mobile-first PWA: book/cancel classes, view belt progress & promotion history, attendance streaks, manage payment method, sign waivers, view curriculum/media, register & pay for events.
- *Why:* every competitor has this; it is the single biggest retention lever and currently entirely absent.

**F2.0.2 — Lead capture & CRM pipeline**
- `leads` table + pipeline stages (new → contacted → trial booked → trial attended → won/lost).
- Embeddable lead/“book a free trial” forms and landing pages hosted by JitzManager. Auto-create lead, assign owner, task reminders.
- Trial scheduling that converts a lead → trial student → member.

**F2.0.3 — Communications engine (email + SMS)**
- Transactional + bulk email (e.g., Resend/SendGrid) and SMS (Twilio). Templates, segments (by status/rank/program/attendance).
- **Automations / drip flows:** new-lead nurture, trial follow-up, win-back for lapsed attendance, birthday, promotion congrats, failed-payment notices. (Kicksite/ZenPlanner Engage parity.)
- Consent/opt-out + per-org sender identity.

**F2.0.4 — Families / households & minors**
- `households` linking multiple students to one billing contact/guardian; one login manages several members; family billing & combined invoices; guardian signs minors' waivers. (ZenPlanner parity; essential for kids programs.)

**F2.0.5 — Notifications & in-app messaging**
- Push (PWA web push) + in-app inbox for class reminders, booking confirmations, announcements.

### 8.2 Data model
- New: `leads`, `lead_activities`, `pipeline_stages`, `tasks`, `message_templates`, `message_log`, `automations`, `automation_runs`, `households`, `household_members`, `forms`, `landing_pages`, `consents`.
- `profiles`/auth: support `member` and `guardian` roles distinct from staff.

### 8.3 Acceptance criteria
- A member can self-serve booking, payment, and progress from a phone with no staff involvement.
- A web lead form creates a CRM lead, triggers a nurture sequence, and is convertible to a member in ≤3 clicks.
- A guardian with 2 kids sees both on one login and one consolidated bill.
- All bulk messaging honors opt-out and records delivery in `message_log`.

---

## 9. v3.0 — Scale & Platform (Multi-discipline, Commerce, Ecosystem)

**Goal:** Expand TAM beyond single-location BJJ and open the platform.

### 9.1 Features

**F3.0.1 — Multi-discipline support**
- Generalize the v1.5 rank engine into discipline templates (Muay Thai, Judo, Karate, Taekwondo belts/khans, MMA). Onboarding picks discipline(s); curriculum/ranks/programs follow. Opens the broad martial-arts market.

**F3.0.2 — Multi-location**
- `locations` under an organization; scope schedules, classes, staff, and reporting by location; cross-location membership rules; per-location dashboards. (Incumbent parity for growing schools/franchises.)

**F3.0.3 — Point-of-sale & inventory**
- In-app POS (card-reader via Stripe Terminal or manual), product catalog, inventory counts, uniform/gear orders, charge to member account. (Direct Gymdesk parity.)

**F3.0.4 — Events, competitions & seminars**
- Event creation with paid registration, capacity, and rosters; seminar/private-lesson booking; **competition records** per student (events entered, results/medals) — a BJJ-flavored differentiator.

**F3.0.5 — Public API, webhooks & integrations**
- REST API + webhooks; Zapier/Make app; accounting export (QuickBooks/Xero); calendar sync (Google/Apple); website embed SDK. Removes the lock-in objection and enables partners.

**F3.0.6 — Door/access control (optional/partner)**
- Integrate with access-control hardware for 24/7 access tiers keyed to membership status.

### 9.2 Data model
- New: `locations`, `discipline_templates`, `products`, `inventory`, `orders`, `order_items`, `events`, `event_registrations`, `competition_results`, `api_keys`, `webhooks`, `webhook_deliveries`.
- Add `location_id` across operational tables (schedules, class_instances, staff assignments, payments).

### 9.3 Acceptance criteria
- A non-BJJ gym can fully onboard and run ranks/curriculum without BJJ assumptions leaking through.
- A 3-location school reports revenue/attendance per location and org-wide.
- A member can buy a gi at the front desk (POS) and register & pay for a tournament online.
- A third party can read students and receive a webhook on new-member events via the public API.

---

## 10. Cross-Cutting Technical Considerations

- **Money:** move all currency to integer-cents or `numeric`; never TEXT. Centralize formatting.
- **Background jobs:** several features (dunning, automations, class-instance generation, reminders) need scheduled/queued execution. Adopt Supabase scheduled functions / pg_cron + a jobs table early (v1.1) so v2.0 automations have a substrate.
- **RLS scale:** as roles multiply (staff tiers, members, guardians), consolidate the repeated `organization_id IN (...)` subqueries into the existing `get_my_organization_id()` SECURITY DEFINER helper to avoid policy drift and recursion.
- **Member auth tier:** members and guardians must NOT see staff data. Plan a clear separation (separate role + RLS surface) before building the portal.
- **Testing & CI:** add lint+typecheck+test gates in CI starting v1.1; prioritize billing math, timezone utilities, and RLS isolation tests.
- **Observability:** structured logging + error tracking (e.g., Sentry) on edge functions, especially webhook handlers.
- **Performance:** add indexes on FK + tenant columns (`organization_id`, `student_id`, `date`) as attendance/payments grow.
- **Migration story:** to win switchers, build an importer (CSV + competitor exports) — Gymdesk markets migration heavily. Extend the existing `ImportStudentsDialog` into a guided importer (members, payments, ranks).

---

## 11. Pricing & Packaging (recommendation)

Mirror the transparent, student-count tiers that buyers already understand from Kicksite, while gating engagement features to drive upgrades:

| Tier | Target | Includes |
|---|---|---|
| **Starter** | new/small (≤25–50) | Students, attendance, schedule, billing, waivers, basic reports |
| **Growth** | established | + rank engine, booking/capacity, kiosk, member portal, email |
| **Pro** | scaling | + CRM/leads, SMS + automations, families, advanced reporting |
| **Multi** | franchises | + multi-location, POS/inventory, events, API |

Keep "all features included per tier" simplicity where possible; differentiate by capability bands and student count rather than nickel-and-diming. SMS is a usage cost — bundle a credit allotment.

---

## 12. Prioritization Summary (what & why, in order)

1. **v1.1 Hardening** — *Why first:* fixes data-model debt (money as TEXT, hardcoded admin) that everything else builds on; adds the dunning + reporting that directly protect gym revenue (and ours).
2. **v1.5 Rank & Booking** — *Why next:* our differentiation and the highest-value daily-use features; the rank engine is a prerequisite for member-portal progress views and multi-discipline.
3. **v2.0 Engagement** — *Why:* biggest retention/growth lever and the clearest competitive gap (no member app, no CRM, no comms today). Depends on the rank/booking data being real.
4. **v3.0 Scale** — *Why last:* TAM-expanding but heavier; best built once core product is sticky and the rank engine is generalizable.

---

## 13. Risks & Open Questions

**Risks**
- *Scope:* v2.0 alone (member app + CRM + comms + families) is large; consider splitting into v2.0 (portal+families) and v2.1 (CRM+comms) if capacity is constrained.
- *Compliance:* SMS (TCPA/opt-in), email (CAN-SPAM), minors' data (COPPA) and waiver enforceability need legal review before v2.0 ships.
- *Billing complexity:* proration, family billing, and dunning interact subtly with Stripe — needs strong test coverage.
- *No tests today:* shipping v1.1+ without a harness risks regressions in billing/RLS.

**Open questions**
1. Is the near-term priority **retention of existing BJJ gyms** (favors v1.5/v2.0) or **TAM expansion to other disciplines** (pulls v3.0 multi-discipline earlier)?
2. Build member app as **PWA** (recommended — one codebase) or native (app-store presence, push parity with ZenPlanner/Kicksite)?
3. Email/SMS: build on **Resend + Twilio** directly, or resell via an aggregator to offer "free texting" like Kicksite?
4. Do we target **franchises/multi-location** as a wedge, or stay single-location longer?
5. Migration: which competitor export formats matter most for switchers we want to win?

---

*Appendix: feature IDs (F<version>.<n>) are stable references for breaking this PRD into tracked issues.*
