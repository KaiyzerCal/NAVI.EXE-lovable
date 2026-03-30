
-- GUILDS
create table if not exists public.guilds (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  tag          text not null default '',
  banner_color text not null default '#6366f1',
  created_by   uuid not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(name)
);
alter table public.guilds enable row level security;
create policy "Anyone can read guilds" on public.guilds
  for select to authenticated using (true);
create policy "Creator can update guild" on public.guilds
  for update to authenticated using (auth.uid() = created_by);
create policy "Creator can delete guild" on public.guilds
  for delete to authenticated using (auth.uid() = created_by);
create policy "Authenticated can create guild" on public.guilds
  for insert to authenticated with check (auth.uid() = created_by);

-- GUILD MEMBERS
create table if not exists public.guild_members (
  id         uuid primary key default gen_random_uuid(),
  guild_id   uuid not null references public.guilds(id) on delete cascade,
  user_id    uuid not null,
  role       text not null default 'member',
  joined_at  timestamptz not null default now(),
  unique(guild_id, user_id)
);
alter table public.guild_members enable row level security;
create policy "Members can read guild roster"
  on public.guild_members for select
  to authenticated using (true);
create policy "Users manage own membership"
  on public.guild_members for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- PARTIES
create table if not exists public.parties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Unnamed Party',
  quest_id    uuid references public.quests(id) on delete set null,
  created_by  uuid not null,
  max_members integer not null default 4,
  status      text not null default 'open',
  xp_pool     integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.parties enable row level security;
create policy "Anyone can read parties" on public.parties
  for select to authenticated using (true);
create policy "Creator manages party" on public.parties
  for all to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- PARTY MEMBERS
create table if not exists public.party_members (
  id        uuid primary key default gen_random_uuid(),
  party_id  uuid not null references public.parties(id) on delete cascade,
  user_id   uuid not null,
  role      text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(party_id, user_id)
);
alter table public.party_members enable row level security;
create policy "Anyone can read party members"
  on public.party_members for select to authenticated using (true);
create policy "Users manage own party membership"
  on public.party_members for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add guild_id to profiles
alter table public.profiles
  add column if not exists guild_id uuid references public.guilds(id) on delete set null;

-- Validation triggers instead of CHECK constraints
create or replace function public.validate_guild_member_role()
returns trigger language plpgsql as $$
begin
  if NEW.role not in ('leader', 'officer', 'member') then
    raise exception 'Invalid guild member role: %', NEW.role;
  end if;
  return NEW;
end;
$$;

create trigger trg_validate_guild_member_role
  before insert or update on public.guild_members
  for each row execute function public.validate_guild_member_role();

create or replace function public.validate_party_status()
returns trigger language plpgsql as $$
begin
  if NEW.status not in ('open', 'in_progress', 'completed', 'disbanded') then
    raise exception 'Invalid party status: %', NEW.status;
  end if;
  return NEW;
end;
$$;

create trigger trg_validate_party_status
  before insert or update on public.parties
  for each row execute function public.validate_party_status();

create or replace function public.validate_party_member_role()
returns trigger language plpgsql as $$
begin
  if NEW.role not in ('leader', 'member') then
    raise exception 'Invalid party member role: %', NEW.role;
  end if;
  return NEW;
end;
$$;

create trigger trg_validate_party_member_role
  before insert or update on public.party_members
  for each row execute function public.validate_party_member_role();
