-- Marketing: campos faltantes de envío/programación
alter table public.marketing_campaigns
  add column if not exists max_per_day integer not null default 1,
  add column if not exists last_sent_at timestamptz;

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_status_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_status_check
  check (status = any (array['draft','scheduled','sending','sent','paused','cancelled']));

alter table public.marketing_campaigns
  drop constraint if exists marketing_campaigns_channel_check;
alter table public.marketing_campaigns
  add constraint marketing_campaigns_channel_check
  check (channel = any (array['email','push','both']));

-- Función server-side de resolución real de audiencia (usada por server fns y el cron)
create or replace function public.resolve_marketing_audience(
  p_audience_type text,
  p_list_id uuid
)
returns table(user_id uuid, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_audience_type = 'list' and p_list_id is not null then
    return query
      select m.user_id, p.email
      from public.marketing_list_members m
      join public.profiles p on p.id = m.user_id
      where m.list_id = p_list_id;
  elsif p_audience_type = 'buyers' then
    return query
      select distinct s.user_id, p.email
      from public.subscriptions s
      join public.profiles p on p.id = s.user_id
      where s.status = 'active' and s.plan <> 'free';
  elsif p_audience_type = 'non_buyers' then
    return query
      select p.id, p.email
      from public.profiles p
      where not exists (
        select 1 from public.subscriptions s
        where s.user_id = p.id and s.status = 'active' and s.plan <> 'free'
      );
  elsif p_audience_type = 'active' then
    return query
      select distinct p.id, p.email
      from public.profiles p
      join public.daily_activity d on d.user_id = p.id
      where d.activity_date >= (current_date - interval '7 days');
  elsif p_audience_type = 'inactive' then
    return query
      select p.id, p.email
      from public.profiles p
      where not exists (
        select 1 from public.daily_activity d
        where d.user_id = p.id and d.activity_date >= (current_date - interval '14 days')
      );
  else
    return query select p.id, p.email from public.profiles p;
  end if;
end;
$$;

revoke all on function public.resolve_marketing_audience(text, uuid) from public;
grant execute on function public.resolve_marketing_audience(text, uuid) to authenticated, service_role;