create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
drop policy if exists "Users can create own invoices" on public.invoices;
drop policy if exists "Users can view own invoices" on public.invoices;
drop policy if exists "Users can update own invoices" on public.invoices;
drop policy if exists "Users can delete own invoices" on public.invoices;
drop function if exists public.is_user_active();
create or replace function private.is_user_active()
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$ select exists (select 1 from public.user_access where user_id = auth.uid() and is_active = true); $$;
revoke all on function private.is_user_active() from public, anon;
grant execute on function private.is_user_active() to authenticated;
create policy "Users can create own invoices" on public.invoices for insert to authenticated with check (user_id = auth.uid() and private.is_user_active());
create policy "Users can view own invoices" on public.invoices for select to authenticated using (user_id = auth.uid() and private.is_user_active());
create policy "Users can update own invoices" on public.invoices for update to authenticated using (user_id = auth.uid() and private.is_user_active()) with check (user_id = auth.uid() and private.is_user_active());
create policy "Users can delete own invoices" on public.invoices for delete to authenticated using (user_id = auth.uid() and private.is_user_active());