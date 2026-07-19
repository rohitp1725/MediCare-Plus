# MediCare+ — Backend Setup (Phase 0)

## 1. Create the Supabase project
1. Go to supabase.com → New project. Pick any region, save the DB password.
2. In **Project Settings → API**, copy the `Project URL` and `anon public` key into a `.env` file (see `.env.example`).

## 2. Run the migrations
In the Supabase dashboard, open **SQL Editor** and run these files **in order**:
1. `001_schema.sql` — tables, enums, indexes, the `updated_at` trigger, and the trigger that turns a Supabase Auth signup into a `profiles` row (+ `patients`/`caregivers`/`doctors` row).
2. `002_rls_policies.sql` — Row Level Security. Every table is locked down by default; these policies scope access to: yourself, patients you're linked to as a caregiver, and patients you're linked to as a doctor.
3. `003_notification_triggers.sql` — automatic alerts (missed dose, low stock/refill, critical vitals, and now sent to the patient themself too, not just their caregiver/doctor). The last function, `check_adherence_alerts()`, needs a scheduler — enable the `pg_cron` extension (**Database → Extensions**) and run:
   ```sql
   select cron.schedule('adherence-check', '0 8 * * *', 'select public.check_adherence_alerts()');
   ```
4. `004_stock_and_views.sql` — automatically decrements a medicine's stock when a dose is marked "taken" (and restores it if that's undone), plus a `patient_adherence_30d` view used by dashboards/reports.
5. `005_link_patient_by_email.sql` — the RPC a caregiver calls to link an existing patient account to their care list by email, without exposing raw emails through the client.

## 3. Configure Auth
**Authentication → URL Configuration**: set your Site URL and add `http://localhost:5173/**` (or your dev port) and your Vercel domain to Redirect URLs — required for password reset links to work.

**Authentication → Email templates**: the "Reset password" template's link must point to your app's reset-password route (the flow: user requests reset → clicks emailed link → lands on your reset page with a recovery token → calls `supabase.auth.updateUser({ password })`).

## 4. Role selection at signup
The `handle_new_user()` trigger reads `role` and `full_name` out of the auth user's metadata, so signup must pass them as user metadata, not as separate table writes:

```js
await supabase.auth.signUp({
  email, password,
  options: { data: { role: "patient", full_name: fullName } }
});
```

`role` must be exactly `patient`, `caregiver`, or `doctor` — the trigger casts it to the `role_type` enum and will fail the signup if it doesn't match.

## 5. Linking patients, caregivers and doctors
A caregiver or doctor only sees a patient once a row exists in `patient_caregiver` / `patient_doctor` with
`status = 'active'`. Every patient must sign up for their own account first (a patient can't be created without
a real `auth.users` row, since `patients.profile_id` is required and unique). Once they have, a caregiver links
them from the app: **My Patients → Add Patient**, entering the patient's email. This calls the
`link_patient_by_email` RPC (`005_link_patient_by_email.sql`), which looks up the account server-side and creates
the link — no email addresses are ever exposed to the browser. Doctor-linking works the same way in principle but
doesn't have an RPC or UI yet; for now, link a doctor manually:
```sql
insert into patient_doctor (patient_id, doctor_id) values ('<patient.id>', '<doctor.id>');
```

## 6. AI features (chatbot, summaries, reports)
Keep `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` **out of the frontend**. Both should only be used inside a Supabase Edge Function that: reads the caller's JWT, checks they can access the requested patient (reuse `can_access_patient()`), calls the Claude API, then writes the result into `ai_insights` or `chat_messages`. The frontend calls the Edge Function, never the AI API directly.

## What's included in this phase
- Full schema: `profiles`, `patients`, `caregivers`, `doctors`, `patient_caregiver`, `patient_doctor`, `medicines`, `dose_logs`, `vitals_logs`, `symptom_logs`, `appointments`, `doctor_visits`, `prescriptions`, `notifications`, `reports`, plus `ai_insights` and `chat_messages` to support the AI features.
- Row Level Security enforcing the patient / caregiver / doctor permission boundaries from the spec (e.g. doctors can never write `dose_logs`; patients can never write `prescriptions` or `doctor_visits`).
- Automatic profile creation and role assignment on signup.
- Automatic alerts for missed doses, low stock, and critical vitals; a scheduled function for adherence alerts.

## What's not built yet
The frontend (auth screens, three dashboards, medicine/vitals/symptom/appointment CRUD, the AI chatbot UI, PDF report export) — see the main chat response for the proposed plan and open questions before that work starts.
