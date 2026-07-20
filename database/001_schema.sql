-- MediCare+ :: 001_schema.sql
-- Core tables, enums, indexes and triggers.
-- Run this first in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- ── ENUMS ────────────────────────────────────────────────────────────────
create type public.role_type as enum ('patient', 'caregiver', 'doctor');
create type public.relation_status as enum ('pending', 'active', 'revoked');
create type public.dose_status as enum ('pending', 'taken', 'missed', 'skipped');
create type public.severity_level as enum ('mild', 'moderate', 'severe');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'rescheduled');
create type public.prescription_status as enum ('active', 'stopped', 'completed');
create type public.notification_type as enum (
  'missed_dose', 'low_stock', 'refill_due', 'appointment_reminder',
  'critical_vital', 'poor_adherence', 'general'
);

-- ── PROFILES (1:1 with auth.users) ──────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.role_type not null default 'patient',
  phone text,
  avatar_emoji text default '👤',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── ROLE DETAIL TABLES ───────────────────────────────────────────────────
create table public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  dob date,
  gender text,
  blood_group text,
  height_cm numeric,
  weight_kg numeric,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.caregivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  specialization text,
  license_number text,
  hospital_name text,
  created_at timestamptz not null default now()
);

-- ── RELATIONSHIP TABLES ──────────────────────────────────────────────────
create table public.patient_caregiver (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  caregiver_id uuid not null references public.caregivers (id) on delete cascade,
  relation text,
  status public.relation_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (patient_id, caregiver_id)
);

create table public.patient_doctor (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  status public.relation_status not null default 'active',
  assigned_at timestamptz not null default now(),
  unique (patient_id, doctor_id)
);

-- ── CLINICAL DATA ────────────────────────────────────────────────────────
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  name text not null,
  brand text,
  type text,
  strength text,
  dose text,
  frequency text,
  times text[] default '{}',
  food_instruction text,
  start_date date,
  end_date date,
  prescribing_doctor_id uuid references public.doctors (id),
  purpose text,
  stock_quantity integer not null default 0,
  refill_threshold integer not null default 5,
  refill_date date,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  scheduled_date date not null,
  scheduled_time time not null,
  status public.dose_status not null default 'pending',
  taken_at timestamptz,
  skipped_reason text,
  logged_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (medicine_id, scheduled_date, scheduled_time)
);

create table public.vitals_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  recorded_at timestamptz not null default now(),
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  glucose_mg_dl numeric,
  pulse_bpm integer,
  oxygen_saturation numeric,
  weight_kg numeric,
  temperature_f numeric,
  notes text,
  logged_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  symptom text not null,
  severity public.severity_level not null default 'mild',
  onset_at timestamptz not null default now(),
  duration text,
  related_medicine_id uuid references public.medicines (id),
  timing_note text,
  notes text,
  doctor_informed boolean not null default false,
  is_emergency boolean not null default false,
  logged_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid references public.doctors (id),
  scheduled_at timestamptz not null,
  reason text,
  status public.appointment_status not null default 'scheduled',
  location text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctor_visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id),
  appointment_id uuid references public.appointments (id),
  visit_date date not null default current_date,
  hospital text,
  reason text,
  diagnosis text,
  changes_made text,
  tests_ordered text,
  next_visit_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id),
  doctor_visit_id uuid references public.doctor_visits (id),
  medicine_id uuid references public.medicines (id),
  medicine_name text not null,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  status public.prescription_status not null default 'active',
  stopped_at timestamptz,
  stopped_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── NOTIFICATIONS, REPORTS, AI ───────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  type public.notification_type not null default 'general',
  title text not null,
  message text,
  severity text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  generated_by uuid references public.profiles (id),
  report_type text not null,
  period_start date,
  period_end date,
  content jsonb,
  file_path text,
  created_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  insight_type text not null,
  period_start date,
  period_end date,
  content text not null,
  metadata jsonb,
  generated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ── INDEXES ──────────────────────────────────────────────────────────────
create index idx_patients_profile on public.patients (profile_id);
create index idx_caregivers_profile on public.caregivers (profile_id);
create index idx_doctors_profile on public.doctors (profile_id);
create index idx_pc_patient on public.patient_caregiver (patient_id);
create index idx_pc_caregiver on public.patient_caregiver (caregiver_id);
create index idx_pd_patient on public.patient_doctor (patient_id);
create index idx_pd_doctor on public.patient_doctor (doctor_id);
create index idx_medicines_patient on public.medicines (patient_id);
create index idx_dose_logs_patient_date on public.dose_logs (patient_id, scheduled_date);
create index idx_dose_logs_medicine on public.dose_logs (medicine_id);
create index idx_vitals_patient on public.vitals_logs (patient_id, recorded_at desc);
create index idx_symptoms_patient on public.symptom_logs (patient_id, onset_at desc);
create index idx_appointments_patient on public.appointments (patient_id, scheduled_at);
create index idx_appointments_doctor on public.appointments (doctor_id, scheduled_at);
create index idx_visits_patient on public.doctor_visits (patient_id, visit_date desc);
create index idx_prescriptions_patient on public.prescriptions (patient_id);
create index idx_notifications_recipient on public.notifications (recipient_id, is_read, created_at desc);
create index idx_reports_patient on public.reports (patient_id);
create index idx_ai_insights_patient on public.ai_insights (patient_id, insight_type);
create index idx_chat_profile on public.chat_messages (profile_id, created_at);

-- ── updated_at TRIGGER ───────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_patients_updated before update on public.patients
  for each row execute function public.set_updated_at();
create trigger trg_medicines_updated before update on public.medicines
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger trg_prescriptions_updated before update on public.prescriptions
  for each row execute function public.set_updated_at();

-- ── AUTO-CREATE PROFILE + ROLE ROW ON SIGNUP ────────────────────────────
-- Expects auth.users.raw_user_meta_data to contain { "role": "...", "full_name": "..." }
-- (passed as `options.data` in supabase.auth.signUp on the frontend).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.role_type;
  v_name text;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::public.role_type, 'patient');
  v_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, full_name, role, phone)
  values (new.id, v_name, v_role, new.raw_user_meta_data ->> 'phone');

  if v_role = 'patient' then
    insert into public.patients (profile_id) values (new.id);
  elsif v_role = 'caregiver' then
    insert into public.caregivers (profile_id) values (new.id);
  elsif v_role = 'doctor' then
    insert into public.doctors (profile_id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── PREVENT ROLE ESCALATION AFTER SIGNUP ────────────────────────────────
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role then
    raise exception 'Role cannot be changed after account creation';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
