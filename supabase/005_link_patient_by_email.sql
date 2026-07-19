-- MediCare+ :: 005_link_patient_by_email.sql
-- Lets a caregiver link an existing patient account to themselves by email,
-- without exposing auth.users or profile emails directly through PostgREST.
-- Run after 004_stock_and_views.sql.

create or replace function public.link_patient_by_email(p_email text, p_relation text default null)
returns table (linked_patient_id uuid, patient_full_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caregiver_id uuid;
  v_target_user_id uuid;
  v_patient_id uuid;
  v_full_name text;
begin
  if public.current_role_type() <> 'caregiver' then
    raise exception 'Only caregivers can link patients';
  end if;

  select id into v_caregiver_id from public.caregivers where profile_id = auth.uid();
  if v_caregiver_id is null then
    raise exception 'Caregiver profile not found';
  end if;

  select u.id into v_target_user_id from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_target_user_id is null then
    raise exception 'No account found with that email';
  end if;

  select p.id, pr.full_name into v_patient_id, v_full_name
  from public.patients p
  join public.profiles pr on pr.id = p.profile_id
  where p.profile_id = v_target_user_id;

  if v_patient_id is null then
    raise exception 'That account is not registered as a patient';
  end if;

  insert into public.patient_caregiver (patient_id, caregiver_id, relation, status)
  values (v_patient_id, v_caregiver_id, p_relation, 'active')
  on conflict (patient_id, caregiver_id) do update set status = 'active', relation = excluded.relation;

  return query select v_patient_id, v_full_name;
end;
$$;

revoke all on function public.link_patient_by_email(text, text) from public;
grant execute on function public.link_patient_by_email(text, text) to authenticated;
