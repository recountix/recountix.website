create index if not exists invoices_user_id_idx on public.invoices(user_id);
drop policy if exists "Users can create own invoices" on public.invoices;
create policy "Users can create own invoices" on public.invoices for insert to authenticated
with check (user_id = (select auth.uid()) and (select private.is_user_active()));
drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices" on public.invoices for select to authenticated
using (user_id = (select auth.uid()) and (select private.is_user_active()));
drop policy if exists "Users can update own invoices" on public.invoices;
create policy "Users can update own invoices" on public.invoices for update to authenticated
using (user_id = (select auth.uid()) and (select private.is_user_active()))
with check (user_id = (select auth.uid()) and (select private.is_user_active()));
drop policy if exists "Users can delete own invoices" on public.invoices;
create policy "Users can delete own invoices" on public.invoices for delete to authenticated
using (user_id = (select auth.uid()) and (select private.is_user_active()));