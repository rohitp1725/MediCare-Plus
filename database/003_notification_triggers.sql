-- MediCare+ :: 003_notification_triggers.sql
-- Event-driven alerts. Runs as SECURITY DEFINER so it can write notifications
-- for caregivers/doctors even though the triggering row was written by the patient.
-- Run after 002_rls_policies.sql.

create or replace function public.notify_patient_carers(
  p_patient_id uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_severity text default 'warning'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, patient_id, type, title, message, severity)
  select p.profile_id, p_patient_id, p_type, p_title, p_message, p_severity
  from public.patients p
  where p.id = p_patient_id;

  insert into public.notifications (recipient_id, patient_id, type, title, message, severity)
  select c.profile_id, p_patient_id, p_type, p_title, p_message, p_severity
  from public.patient_caregiver pc
  join public.caregivers c on c.id = pc.caregiver_id
  where pc.patient_id = p_patient_id and pc.status = 'active';

  insert into public.notifications (recipient_id, patient_id, type, title, message, severity)
  select d.profile_id, p_patient_id, p_type, p_title, p_message, p_severity
  from public.patient_doctor pd
  join public.doctors d on d.id = pd.doctor_id
  where pd.patient_id = p_patient_id and pd.status = 'active';
end;
$$;

-- ── MISSED DOSE ──────────────────────────────────────────────────────────
create or replace function public.on_dose_log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_med_name text;
begin
  if new.status = 'missed' and (old.status is null or old.status <> 'missed') then
    select name into v_med_name from public.medicines where id = new.medicine_id;
    perform public.notify_patient_carers(
      new.patient_id,
      'missed_dose',
      'Missed dose',
      coalesce(v_med_name, 'A medicine') || ' scheduled at ' || to_char(new.scheduled_time, 'HH12:MI AM') || ' was missed.',
      'warning'
    );
  end if;
  return new;
end;
$$;

create trigger trg_dose_log_missed
  after insert or update on public.dose_logs
  for each row execute function public.on_dose_log_change();

-- ── LOW STOCK / REFILL DUE ───────────────────────────────────────────────
create or replace function public.on_medicine_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active
     and new.stock_quantity <= new.refill_threshold
     and (old.stock_quantity is null or old.stock_quantity > old.refill_threshold) then
    perform public.notify_patient_carers(
      new.patient_id,
      'low_stock',
      'Refill needed',
      new.name || ' is running low (' || new.stock_quantity || ' left).',
      'warning'
    );
  end if;
  return new;
end;
$$;

create trigger trg_medicine_low_stock
  after insert or update on public.medicines
  for each row execute function public.on_medicine_stock_change();

-- ── CRITICAL VITALS ──────────────────────────────────────────────────────
create or replace function public.on_vitals_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.blood_pressure_systolic is not null and new.blood_pressure_systolic >= 180)
     or (new.blood_pressure_diastolic is not null and new.blood_pressure_diastolic >= 120)
     or (new.oxygen_saturation is not null and new.oxygen_saturation < 90)
     or (new.pulse_bpm is not null and (new.pulse_bpm < 40 or new.pulse_bpm > 130))
     or (new.glucose_mg_dl is not null and (new.glucose_mg_dl < 54 or new.glucose_mg_dl > 300)) then
    perform public.notify_patient_carers(
      new.patient_id,
      'critical_vital',
      'Critical vital reading',
      'A recorded vital reading is outside the safe range and needs attention.',
      'critical'
    );
  end if;
  return new;
end;
$$;

create trigger trg_vitals_critical
  after insert on public.vitals_logs
  for each row execute function public.on_vitals_insert();

-- ── POOR ADHERENCE (call periodically, e.g. via pg_cron or an Edge Function) ─
-- Flags patients whose taken-rate over the last 7 days is below 70%.
-- Enable pg_cron in the Supabase dashboard (Database > Extensions) and schedule:
--   select cron.schedule('adherence-check', '0 8 * * *', 'select public.check_adherence_alerts()');
create or replace function public.check_adherence_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_rate numeric;
begin
  for r in select id from public.patients where is_active loop
    select
      case when count(*) = 0 then 1
      else count(*) filter (where status = 'taken')::numeric / count(*) end
    into v_rate
    from public.dose_logs
    where patient_id = r.id and scheduled_date >= current_date - interval '7 days';

    if v_rate < 0.7 then
      perform public.notify_patient_carers(
        r.id,
        'poor_adherence',
        'Low medication adherence',
        'Adherence over the last 7 days has dropped below 70%.',
        'warning'
      );
    end if;
  end loop;
end;
$$;
