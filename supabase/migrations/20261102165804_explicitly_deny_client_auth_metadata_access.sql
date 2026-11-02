create policy "Block client access to user access" on public.user_access
for all to anon, authenticated using (false) with check (false);
create policy "Block client access to login attempts" on public.login_attempts
for all to anon, authenticated using (false) with check (false);