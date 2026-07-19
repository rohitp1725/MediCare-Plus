-- MediCare+ :: 002_rls_policies.sql
-- Row Level Security helper functions and policies.
-- Run after 001_schema.sql.

-- ── HELPER FUNCTIONS (SECURITY DEFINER to avoid recursive RLS) ──────────
create or replace function public.current_role_type()
returns public.role_type
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_own_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.patients
    where id = p_patient_id and profile_id = auth.uid()
  );
$$;

create or replace function public.is_assigned_caregiver(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_caregiver pc
    join public.caregivers c on c.id = pc.caregiver_id
    where pc.patient_id = p_patient_id
      and c.profile_id = auth.uid()
      and pc.status = 'active'
  );
$$;

create or replace function public.is_assigned_doctor(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patient_doctor pd
    join public.doctors d on d.id = pd.doctor_id
    where pd.patient_id = p_patient_id
      and d.profile_id = auth.uid()
      and pd.status = 'active'
  );
$$;

create or replace function public.can_access_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_own_patient(p_patient_id)
      or public.is_assigned_caregiver(p_patient_id)
      or public.is_assigned_doctor(p_patient_id);
$$;

-- ── ENABLE RLS ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.caregivers enable row level security;
alter table public.doctors enable row level security;
alter table public.patient_caregiver enable row level security;
alter table public.patient_doctor enable row level security;
alter table public.medicines enable row level security;
alter table public.dose_logs enable row level security;
alter table public.vitals_logs enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_visits enable row level security;
alter table public.prescriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.ai_insights enable row level security;
alter table public.chat_messages enable row level security;

-- ── PROFILES ─────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1 from public.patients p
    where p.profile_id = profiles.id and public.can_access_patient(p.id)
  )
  or exists (
    select 1 from public.caregivers c
    join public.patient_caregiver pc on pc.caregiver_id = c.id
    join public.patients pt on pt.id = pc.patient_id
    where c.profile_id = profiles.id and pt.profile_id = auth.uid() and pc.status = 'active'
  )
  or exists (
    select 1 from public.doctors d
    join public.patient_doctor pd on pd.doctor_id = d.id
    join public.patients pt on pt.id = pd.patient_id
    where d.profile_id = profiles.id and pt.profile_id = auth.uid() and pd.status = 'active'
  )
);

create policy profiles_update_self on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

-- ── PATIENTS ─────────────────────────────────────────────────────────────
create policy patients_select on public.patients for select
using (public.can_access_patient(id));

create policy patients_insert on public.patients for insert
with check (
  (profile_id = auth.uid() and public.current_role_type() = 'patient')
  or public.current_role_type() = 'caregiver'
);

create policy patients_update on public.patients for update
using (public.is_own_patient(id) or public.is_assigned_caregiver(id))
with check (public.is_own_patient(id) or public.is_assigned_caregiver(id));

create policy patients_delete on public.patients for delete
using (public.is_assigned_caregiver(id));

-- ── CAREGIVERS / DOCTORS ─────────────────────────────────────────────────
create policy caregivers_select on public.caregivers for select
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.patient_caregiver pc
    join public.patients pt on pt.id = pc.patient_id
    where pc.caregiver_id = caregivers.id and pt.profile_id = auth.uid()
  )
);
create policy caregivers_update_self on public.caregivers for update
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy doctors_select on public.doctors for select
using (
  profile_id = auth.uid()
  or exists (
    select 1 from public.patient_doctor pd
    join public.patients pt on pt.id = pd.patient_id
    where pd.doctor_id = doctors.id and pt.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.patient_doctor pd
    where pd.doctor_id = doctors.id and public.is_assigned_caregiver(pd.patient_id)
  )
);
create policy doctors_update_self on public.doctors for update
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ── RELATIONSHIP TABLES ──────────────────────────────────────────────────
create policy patient_caregiver_select on public.patient_caregiver for select
using (public.can_access_patient(patient_id));

create policy patient_caregiver_insert on public.patient_caregiver for insert
with check (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy patient_caregiver_update on public.patient_caregiver for update
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy patient_caregiver_delete on public.patient_caregiver for delete
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy patient_doctor_select on public.patient_doctor for select
using (public.can_access_patient(patient_id));

create policy patient_doctor_insert on public.patient_doctor for insert
with check (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy patient_doctor_update on public.patient_doctor for update
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy patient_doctor_delete on public.patient_doctor for delete
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

-- ── MEDICINES (caregiver manages, doctor can stop, patient views) ───────
create policy medicines_select on public.medicines for select
using (public.can_access_patient(patient_id));

create policy medicines_insert on public.medicines for insert
with check (public.is_assigned_caregiver(patient_id));

create policy medicines_update on public.medicines for update
using (public.is_assigned_caregiver(patient_id) or public.is_assigned_doctor(patient_id))
with check (public.is_assigned_caregiver(patient_id) or public.is_assigned_doctor(patient_id));

create policy medicines_delete on public.medicines for delete
using (public.is_assigned_caregiver(patient_id));

-- ── DOSE LOGS (patient + caregiver log; doctor read-only) ───────────────
create policy dose_logs_select on public.dose_logs for select
using (public.can_access_patient(patient_id));

create policy dose_logs_insert on public.dose_logs for insert
with check (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy dose_logs_update on public.dose_logs for update
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));

create policy dose_logs_delete on public.dose_logs for delete
using (public.is_assigned_caregiver(patient_id));

-- ── VITALS / SYMPTOMS (patient + caregiver log; doctor read-only) ──────
create policy vitals_select on public.vitals_logs for select
using (public.can_access_patient(patient_id));
create policy vitals_insert on public.vitals_logs for insert
with check (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));
create policy vitals_update on public.vitals_logs for update
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));
create policy vitals_delete on public.vitals_logs for delete
using (public.is_assigned_caregiver(patient_id));

create policy symptoms_select on public.symptom_logs for select
using (public.can_access_patient(patient_id));
create policy symptoms_insert on public.symptom_logs for insert
with check (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));
create policy symptoms_update on public.symptom_logs for update
using (public.is_own_patient(patient_id) or public.is_assigned_caregiver(patient_id));
create policy symptoms_delete on public.symptom_logs for delete
using (public.is_assigned_caregiver(patient_id));

-- ── APPOINTMENTS (caregiver + doctor manage; patient views) ─────────────
create policy appointments_select on public.appointments for select
using (public.can_access_patient(patient_id));
create policy appointments_insert on public.appointments for insert
with check (public.is_assigned_caregiver(patient_id) or public.is_assigned_doctor(patient_id));
create policy appointments_update on public.appointments for update
using (public.is_assigned_caregiver(patient_id) or public.is_assigned_doctor(patient_id));
create policy appointments_delete on public.appointments for delete
using (public.is_assigned_caregiver(patient_id) or public.is_assigned_doctor(patient_id));

-- ── DOCTOR VISITS / PRESCRIPTIONS (doctor-owned clinical records) ───────
create policy visits_select on public.doctor_visits for select
using (public.can_access_patient(patient_id));
create policy visits_insert on public.doctor_visits for insert
with check (public.is_assigned_doctor(patient_id));
create policy visits_update on public.doctor_visits for update
using (public.is_assigned_doctor(patient_id));
create policy visits_delete on public.doctor_visits for delete
using (public.is_assigned_doctor(patient_id));

create policy prescriptions_select on public.prescriptions for select
using (public.can_access_patient(patient_id));
create policy prescriptions_insert on public.prescriptions for insert
with check (public.is_assigned_doctor(patient_id));
create policy prescriptions_update on public.prescriptions for update
using (public.is_assigned_doctor(patient_id));
create policy prescriptions_delete on public.prescriptions for delete
using (public.is_assigned_doctor(patient_id));

-- ── NOTIFICATIONS ────────────────────────────────────────────────────────
create policy notifications_select on public.notifications for select
using (recipient_id = auth.uid());
create policy notifications_insert on public.notifications for insert
with check (patient_id is null or public.can_access_patient(patient_id));
create policy notifications_update on public.notifications for update
using (recipient_id = auth.uid());
create policy notifications_delete on public.notifications for delete
using (recipient_id = auth.uid());

-- ── REPORTS ──────────────────────────────────────────────────────────────
create policy reports_select on public.reports for select
using (public.can_access_patient(patient_id));
create policy reports_insert on public.reports for insert
with check (public.can_access_patient(patient_id));
create policy reports_delete on public.reports for delete
using (public.is_assigned_caregiver(patient_id));

-- ── AI INSIGHTS ──────────────────────────────────────────────────────────
create policy ai_insights_select on public.ai_insights for select
using (public.can_access_patient(patient_id));
create policy ai_insights_insert on public.ai_insights for insert
with check (public.can_access_patient(patient_id));

-- ── CHAT MESSAGES (private to the patient, visible to their caregiver) ──
create policy chat_select on public.chat_messages for select
using (
  profile_id = auth.uid()
  or (patient_id is not null and public.is_assigned_caregiver(patient_id))
);
create policy chat_insert on public.chat_messages for insert
with check (profile_id = auth.uid());
