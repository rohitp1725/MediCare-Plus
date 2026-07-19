-- MediCare+ :: 007_link_doctor_by_email.sql
-- Lets a doctor or caregiver link an existing patient to a doctor by email.
-- Run after 006_dose_log_generation.sql.

create or replace function public.link_doctor_to_patient(p_patient_email text, p_doctor_email text default null)
returns table (linked_patient_id uuid, patient_full_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doctor_id uuid;
  v_target_patient_id uuid;
  v_patient_full_name text;
  v_caller_role public.role_type;
begin
  v_caller_role := public.current_role_type();

  -- Doctors can link themselves to a patient by providing the patient email
  if v_caller_role = 'doctor' then
    select d.id into v_doctor_id
    from public.doctors d
    where d.profile_id = auth.uid();

    if v_doctor_id is null then
      raise exception 'Doctor profile not found';
    end if;

    select p.id, pr.full_name into v_target_patient_id, v_patient_full_name
    from public.patients p
    join public.profiles pr on pr.id = p.profile_id
    join auth.users u on u.id = pr.id
    where lower(u.email) = lower(trim(p_patient_email));

    if v_target_patient_id is null then
      raise exception 'No patient found with that email';
    end if;

    insert into public.patient_doctor (patient_id, doctor_id, status)
    values (v_target_patient_id, v_doctor_id, 'active')
    on conflict (patient_id, doctor_id) do update set status = 'active';

    return query select v_target_patient_id, v_patient_full_name;

  -- Caregivers can link one of their patients to a doctor by providing the doctor email
  elsif v_caller_role = 'caregiver' then
    -- Verify the patient is assigned to this caregiver
    select p.id, pr.full_name into v_target_patient_id, v_patient_full_name
    from public.patients p
    join public.profiles pr on pr.id = p.profile_id
    join auth.users u on u.id = pr.id
    where lower(u.email) = lower(trim(p_patient_email))
      and public.is_assigned_caregiver(p.id);

    if v_target_patient_id is null then
      raise exception 'Patient not found or not assigned to you';
    end if;

    -- Find the doctor by email
    select d.id into v_doctor_id
    from public.doctors d
    join auth.users u on u.id = d.profile_id
    where lower(u.email) = lower(trim(p_doctor_email));

    if v_doctor_id is null then
      raise exception 'No doctor found with that email';
    end if;

    insert into public.patient_doctor (patient_id, doctor_id, status)
    values (v_target_patient_id, v_doctor_id, 'active')
    on conflict (patient_id, doctor_id) do update set status = 'active';

    return query select v_target_patient_id, v_patient_full_name;
  else
    raise exception 'Only doctors or caregivers can create doctor-patient links';
  end if;
end;
$$;

revoke all on function public.link_doctor_to_patient(text, text) from public;
grant execute on function public.link_doctor_to_patient(text, text) to authenticated;
