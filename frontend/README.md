# MediCare+ — Frontend (V2)

React + Vite + TypeScript + Tailwind CSS v4, wired to Supabase. This is a ground-up rebuild of the original vanilla
HTML/CSS/JS prototype — same visual design (colors, type, spacing, emoji iconography), real backend underneath.

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · Supabase · React Router v7 · TanStack Query ·
React Hook Form + Zod · Recharts · Framer Motion · Lucide React · date-fns

## Setup

1. Run the migrations in `../supabase/` against a Supabase project (see `../supabase/SETUP.md`).
2. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from your Supabase project's
   **Settings → API**.
3. `npm install`
4. `npm run dev` — opens on `http://localhost:5173`

`npm run build` type-checks with `tsc -b` and produces a production bundle in `dist/`. `npm run lint` runs oxlint.

## What's built (this phase)

- **Design system**: every color, radius, shadow, and font from the original `styles.css` ported into
  `src/index.css` as Tailwind v4 `@theme` tokens (`bg-sage`, `rounded-md`, `shadow-sm`, etc. now map to the exact
  original values), plus reusable primitives in `src/components/ui/`.
- **Auth**: Login, Signup (with patient/caregiver/doctor role selection), Forgot Password, and Reset Password,
  all wired to Supabase Auth. Signup passes `role`/`full_name` as user metadata, which the `handle_new_user()`
  database trigger reads to create the right `profiles` + role-detail row automatically.
- **Role-based routing**: `ProtectedRoute` guards every dashboard route by role and redirects to the correct
  home if a signed-in user hits the wrong one; `RootRedirect` sends `/` to the right place based on session state.
- **Dashboard shell**: `Sidebar` + `Topbar` + `AppShell`, rebuilt from the original `dashboard.html`, with
  per-role navigation (`src/config/navigation.ts`). The emergency button from the original design was dropped per
  spec. Dark mode and toast notifications were listed in the spec but didn't actually exist in the original code —
  toasts are newly built (`src/components/toast/`); there was no dark mode to preserve.
  - **Note**: the caregiver/doctor nav is intentionally smaller than the original patient nav. The original
    prototype hardcoded one patient per caregiver; the new schema supports many patients per caregiver/doctor, so
    patient-scoped pages (profile, medicines, vitals, etc.) will live under `/caregiver/patients/:patientId/...`
    once that CRUD is built, rather than as flat top-level nav items.
- **Notifications**: a live bell with unread count and a dropdown (mark-as-read wired to Supabase) in the Topbar,
  used by all three roles.
- **Home pages**: each role's dashboard home pulls real data from Supabase — active medicine count, today's dose
  breakdown, and next appointment for patients; linked patient roster and low-stock count for caregivers; assigned
  patients and upcoming appointment count for doctors. All three handle loading, error, and empty states.
- **Medicine management (caregiver)**: `My Patients` → add a patient by email (via a `SECURITY DEFINER` RPC,
  `link_patient_by_email`, so raw emails are never exposed through the client) → open a patient to add, edit,
  deactivate, or delete their medicines (name, type, strength, dose times, food instructions, stock, refill
  threshold).
- **Medicines (patient)**: read-only view of active and past medicines.
- **Daily Tracker (patient)**: today's doses are auto-generated from each active medicine's scheduled times (via
  an idempotent upsert, so revisiting the page never creates duplicates), with Taken / Missed / Skip (with reason)
  actions. Marking a dose "taken" automatically decrements the medicine's stock via a database trigger
  (`004_stock_and_views.sql`) — reversible if the status is changed again.

## What's not built yet

Health Logs, Symptoms, Doctor Visits, Reports & AI, the AI Assistant chatbot, caregiver/doctor appointment
scheduling, and the doctor's patient/visit/prescription screens are still placeholders (`ComingSoonPage`). The
database schema and RLS policies for all of these already exist (see `../supabase/`).

## Project structure

```
src/
  components/
    ui/         Reusable primitives (Button, Input, Card, StatCard, EmptyState, ...)
    layout/     Sidebar, Topbar, AppShell, AuthLayout, NotificationBell
    toast/      Toast notification system
  config/       Per-role navigation and page title/subtitle maps
  context/      AuthContext (Supabase session + profile)
  hooks/        Data-fetching hooks (TanStack Query + Supabase)
  lib/          Supabase client, query client, Zod schemas
  pages/        Route components, grouped by auth/patient/caregiver/doctor
  types/        Database types (mirrors the SQL schema) and shared domain types
  router.tsx    Route tree
```
