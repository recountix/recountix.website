create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.login_attempts (
  attempt_key text primary key,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.user_access enable row level security;
alter table public.login_attempts enable row level security;
revoke all on table public.user_access from anon, authenticated;
revoke all on table public.login_attempts from anon, authenticated;
grant all on table public.user_access to service_role;
grant all on table public.login_attempts to service_role;
insert into public.user_access(user_id, username, is_active)
select id, 'Admin', true from auth.users
where lower(email) = 'crazymade558@gmail.com'
on conflict (user_id) do update set username = excluded.username, updated_at = now();
create or replace function public.is_user_active()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from public.user_access where user_id = auth.uid() and is_active = true); $$;
revoke all on function public.is_user_active() from public, anon;
grant execute on function public.is_user_active() to authenticated;
create or replace function public.login_attempt_gate(p_attempt_key text, p_action text, p_limit integer default 5)
returns table(allowed boolean, failed_attempts integer, locked_until timestamptz)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_count integer; v_locked timestamptz;
begin
 if p_attempt_key is null or length(p_attempt_key) < 16 or p_action not in ('check','failure','success') or p_limit < 1 or p_limit > 30 then raise exception 'Invalid login gate request'; end if;
 if p_action = 'success' then delete from public.login_attempts where attempt_key = p_attempt_key; return query select true, 0, null::timestamptz; return; end if;
 if p_action = 'check' then
  select coalesce(a.failed_attempts,0), a.locked_until into v_count, v_locked from public.login_attempts a where a.attempt_key = p_attempt_key;
  if not found then v_count := 0; v_locked := null; end if;
  return query select (v_locked is null or v_locked <= now()), v_count, v_locked; return;
 end if;
 insert into public.login_attempts(attempt_key, failed_attempts, locked_until, updated_at)
 values (p_attempt_key, 1, case when p_limit <= 1 then now() + interval '15 minutes' else null end, now())
 on conflict (attempt_key) do update
 set failed_attempts = case when public.login_attempts.locked_until is not null and public.login_attempts.locked_until <= now() then 1 else public.login_attempts.failed_attempts + 1 end,
 locked_until = case when (case when public.login_attempts.locked_until is not null and public.login_attempts.locked_until <= now() then 1 else public.login_attempts.failed_attempts + 1 end) >= p_limit then now() + interval '15 minutes' else null end,
 updated_at = now()
 returning public.login_attempts.failed_attempts, public.login_attempts.locked_until into v_count, v_locked;
 return query select (v_locked is null or v_locked <= now()), v_count, v_locked;
end; $$;
revoke all on function public.login_attempt_gate(text,text,integer) from public, anon, authenticated;
grant execute on function public.login_attempt_gate(text,text,integer) to service_role;
drop policy if exists "Users can create own invoices" on public.invoices;
create policy "Users can create own invoices" on public.invoices for insert to authenticated with check (user_id = auth.uid() and public.is_user_active());
drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices" on public.invoices for select to authenticated using (user_id = auth.uid() and public.is_user_active());
drop policy if exists "Users can update own invoices" on public.invoices;
create policy "Users can update own invoices" on public.invoices for update to authenticated using (user_id = auth.uid() and public.is_user_active()) with check (user_id = auth.uid() and public.is_user_active());
drop policy if exists "Users can delete own invoices" on public.invoices;
create policy "Users can delete own invoices" on public.invoices for delete to authenticated using (user_id = auth.uid() and public.is_user_active());