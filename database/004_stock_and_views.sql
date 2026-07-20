-- MediCare+ :: 004_stock_and_views.sql
-- Automatic stock reduction when a dose is marked taken, plus a couple of
-- read-optimized views used by the adherence/analytics screens.
-- Run after 003_notification_triggers.sql.

create or replace function public.on_dose_taken_reduce_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'taken' and (old.status is null or old.status <> 'taken') then
    update public.medicines
    set stock_quantity = greatest(stock_quantity - 1, 0)
    where id = new.medicine_id;
  elsif old.status = 'taken' and new.status <> 'taken' then
    update public.medicines
    set stock_quantity = stock_quantity + 1
    where id = new.medicine_id;
  end if;
  return new;
end;
$$;

create trigger trg_dose_taken_reduce_stock
  after insert or update on public.dose_logs
  for each row execute function public.on_dose_taken_reduce_stock();

-- ── ADHERENCE VIEW ───────────────────────────────────────────────────────
-- Per-patient adherence rate over the last 30 days, used by dashboards/reports.
create or replace view public.patient_adherence_30d as
select
  patient_id,
  count(*) filter (where status = 'taken') as taken_count,
  count(*) filter (where status = 'missed') as missed_count,
  count(*) filter (where status = 'skipped') as skipped_count,
  count(*) as total_count,
  case when count(*) = 0 then null
       else round(count(*) filter (where status = 'taken')::numeric / count(*) * 100, 1)
  end as adherence_pct
from public.dose_logs
where scheduled_date >= current_date - interval '30 days'
group by patient_id;

alter view public.patient_adherence_30d set (security_invoker = on);
