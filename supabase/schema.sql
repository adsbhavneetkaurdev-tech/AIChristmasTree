-- ═══════════════════════════════════════════════════════════════════════════
--  Wish Tree — Supabase schema (multi-event)
--  Run once in the Supabase SQL Editor. Safe to re-run, and safe to run on a
--  database created by the earlier single-event version (it upgrades it).
--
--  One Supabase project can serve many customers' events: every wish carries
--  an event_id, and each deployment only ever reads/writes its own event.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

do $$ begin
  create type public.wish_status as enum ('pending', 'approved', 'rejected', 'archived');
exception when duplicate_object then null; end $$;

-- ─── Wishes ────────────────────────────────────────────────────────────────
create table if not exists public.wishes (
  id           uuid primary key default gen_random_uuid(),
  event_id     text not null default 'default',
  message      text not null,
  name         text,
  status       public.wish_status not null default 'pending',
  -- Random seed that gives every wish its own ornament shape, colour and twinkle.
  seed         integer not null default floor(random() * 2147483647)::integer,
  created_at   timestamptz not null default now(),
  approved_at  timestamptz
);

-- Upgrade an older single-event table in place.
alter table public.wishes add column if not exists event_id text not null default 'default';
alter table public.wishes drop constraint if exists wishes_message_check;
alter table public.wishes drop constraint if exists wishes_message_length;
alter table public.wishes add constraint wishes_message_length check (char_length(btrim(message)) between 1 and 500);
alter table public.wishes drop constraint if exists wishes_name_check;
alter table public.wishes drop constraint if exists wishes_name_length;
alter table public.wishes add constraint wishes_name_length check (name is null or char_length(name) <= 40);
alter table public.wishes drop constraint if exists wishes_event_id_format;
alter table public.wishes add constraint wishes_event_id_format check (event_id ~ '^[a-z0-9-]{1,64}$');

create index if not exists wishes_event_status_idx on public.wishes (event_id, status, approved_at);
create index if not exists wishes_event_created_idx on public.wishes (event_id, created_at desc);

-- ─── Per-event state ───────────────────────────────────────────────────────
-- `version` is bumped on every change to that event's wishes. Displays and the
-- admin dashboard subscribe to their event's row over Supabase Realtime and
-- refetch when it changes. `auto_approve` is the live moderation switch
-- (its initial value comes from config.json → moderation.requireApproval).
create table if not exists public.event_state (
  event_id      text primary key check (event_id ~ '^[a-z0-9-]{1,64}$'),
  version       bigint not null default 0,
  auto_approve  boolean not null default false,
  reset_at      timestamptz,
  updated_at    timestamptz not null default now()
);

-- ─── Triggers ──────────────────────────────────────────────────────────────
create or replace function public.wishes_set_approved_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.approved_at := now();
  end if;
  return new;
end $$;

drop trigger if exists wishes_set_approved_at on public.wishes;
create trigger wishes_set_approved_at
  before insert or update of status on public.wishes
  for each row execute function public.wishes_set_approved_at();

create or replace function public.bump_event_version()
returns trigger language plpgsql security definer set search_path = public as $$
declare ev text;
begin
  ev := case when tg_op = 'DELETE' then old.event_id else new.event_id end;
  insert into public.event_state (event_id, version) values (ev, 1)
  on conflict (event_id) do update set version = public.event_state.version + 1, updated_at = now();
  return null;
end $$;

-- Replace the single-event trigger from the earlier version, if present.
drop trigger if exists wishes_bump_version on public.wishes;
drop trigger if exists wishes_bump_event_version on public.wishes;
create trigger wishes_bump_event_version
  after insert or update or delete on public.wishes
  for each row execute function public.bump_event_version();

-- ─── Row Level Security ────────────────────────────────────────────────────
-- The browser (anon key) can only READ approved wishes and event state.
-- All writes go through the app's API with the service-role key, which
-- validates, filters, rate-limits and enforces moderation.
alter table public.wishes enable row level security;
alter table public.event_state enable row level security;

drop policy if exists "Public can read approved wishes" on public.wishes;
create policy "Public can read approved wishes"
  on public.wishes for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "Public can read event state" on public.event_state;
create policy "Public can read event state"
  on public.event_state for select to anon, authenticated
  using (true);

-- ─── Table privileges ──────────────────────────────────────────────────────
-- Newer Supabase projects don't grant table access to the API roles by default.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.wishes, public.event_state to anon, authenticated;
grant select, insert, update, delete on public.wishes, public.event_state to service_role;

-- ─── Realtime ──────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.event_state;
exception when duplicate_object then null; end $$;
