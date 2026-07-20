-- MediCare+ :: 008_patient_conditions.sql
-- Tracks a patient's chronic conditions / disease history.
-- Run after 007_link_doctor_by_email.sql.

create table if not exists public.patient_conditions (
  id             uuid        primary key default gen_random_uuid(),
  patient_id     uuid        not null references public.patients(id) on delete cascade,
  name           text        not null,
  diagnosed_date date,
  severity       text        check (severity in ('mild','moderate','severe')) not null default 'mild',
  treating_doctor text,
  notes          text,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- RLS
alter table public.patient_conditions enable row level security;

-- Patients can see/manage their own conditions
create policy "patients_manage_own_conditions"
  on public.patient_conditions
  using (
    patient_id in (
      select id from public.patients where profile_id = auth.uid()
    )
  )
  with check (
    patient_id in (
      select id from public.patients where profile_id = auth.uid()
    )
  );

-- Caregivers can see conditions of their assigned patients
create policy "caregivers_view_patient_conditions"
  on public.patient_conditions
  for select
  using (public.is_assigned_caregiver(patient_id));

-- Caregivers can insert/update conditions for assigned patients
create policy "caregivers_manage_patient_conditions"
  on public.patient_conditions
  for all
  using (public.is_assigned_caregiver(patient_id))
  with check (public.is_assigned_caregiver(patient_id));

-- Doctors can view conditions of their patients
create policy "doctors_view_patient_conditions"
  on public.patient_conditions
  for select
  using (
    patient_id in (
      select pd.patient_id
      from public.patient_doctor pd
      join public.doctors d on d.id = pd.doctor_id
      where d.profile_id = auth.uid()
        and pd.status = 'active'
    )
  );

grant all on public.patient_conditions to authenticated;

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_patient_conditions_updated_at
  before update on public.patient_conditions
  for each row execute function public.set_updated_at();
