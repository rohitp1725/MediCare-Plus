-- MediCare+ :: 006_dose_log_generation.sql
-- Auto-generates dose_logs rows when a medicine is added/activated.
-- Also provides a function called nightly via pg_cron to generate tomorrow's logs.
-- Run after 005_link_patient_by_email.sql.

-- ── GENERATE DOSE LOGS FOR A SPECIFIC DATE ───────────────────────────────
create or replace function public.generate_dose_logs_for_date(p_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_medicine record;
  v_time text;
begin
  for v_medicine in
    select id, patient_id, times
    from public.medicines
    where is_active = true
      and (start_date is null or start_date <= p_date)
      and (end_date is null or end_date >= p_date)
  loop
    if v_medicine.times is not null then
      foreach v_time in array v_medicine.times
      loop
        insert into public.dose_logs (medicine_id, patient_id, scheduled_date, scheduled_time, status)
        values (v_medicine.id, v_medicine.patient_id, p_date, v_time::time, 'pending')
        on conflict (medicine_id, scheduled_date, scheduled_time) do nothing;
      end loop;
    end if;
  end loop;
end;
$$;

grant execute on function public.generate_dose_logs_for_date(date) to service_role;

-- ── TRIGGER: GENERATE TODAY'S LOGS WHEN A MEDICINE IS INSERTED/ACTIVATED ─
create or replace function public.trigger_generate_dose_logs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_time text;
  v_today date := current_date;
begin
  -- Only act on active medicines with times
  if new.is_active = true and new.times is not null and array_length(new.times, 1) > 0 then
    -- Skip if start_date is in the future
    if new.start_date is null or new.start_date <= v_today then
      -- Skip if end_date has passed
      if new.end_date is null or new.end_date >= v_today then
        foreach v_time in array new.times
        loop
          insert into public.dose_logs (medicine_id, patient_id, scheduled_date, scheduled_time, status)
          values (new.id, new.patient_id, v_today, v_time::time, 'pending')
          on conflict (medicine_id, scheduled_date, scheduled_time) do nothing;
        end loop;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_medicine_generate_dose_logs
  after insert or update of is_active, times on public.medicines
  for each row execute function public.trigger_generate_dose_logs();
