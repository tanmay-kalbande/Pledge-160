/*
  # Pledge 160 Database Schema
  Run this in the Supabase SQL Editor.
  It is safe to run this multiple times; it will not delete your data.
*/

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  current_streak integer default 0,
  best_streak integer default 0,
  last_check_in_date text,
  journey_start_date text,
  pledge_goal integer default 160,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add column if it was missing in previous versions
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'pledge_goal') then
    alter table public.profiles add column pledge_goal integer default 160;
  end if;
end $$;

-- 2. Logs Table (Check-ins)
create table if not exists public.logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date text not null,
  status text not null, -- 'SUCCESS' or 'RELAPSE'
  note text,
  mood text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Partnerships Table (Multiple Partners)
create table if not exists public.partnerships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  receiver_email text not null,
  status text default 'pending', -- 'pending' or 'accepted'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.logs enable row level security;
alter table public.partnerships enable row level security;

-- 5. Policies

-- Profiles: Viewable by self, partners, AND people involved in a pending request (so you can see who invited you)
drop policy if exists "Public profiles are viewable by self and partners" on public.profiles;
create policy "Public profiles are viewable by self and partners" on public.profiles
  for select using (
    auth.uid() = id or 
    exists (
      select 1 from public.partnerships 
      where 
        -- Case 1: They are my partner (Accepted)
        (requester_id = auth.uid() and receiver_email = profiles.email and status = 'accepted')
        or (requester_id = profiles.id and receiver_email = (select email from profiles where id = auth.uid()) and status = 'accepted')
        -- Case 2: They sent me a request (Pending or Accepted) - Allows seeing name on invite
        or (requester_id = profiles.id and receiver_email = (select email from profiles where id = auth.uid()))
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Logs: Viewable by self and ACCEPTED partners only
drop policy if exists "Logs viewable by self and partners" on public.logs;
create policy "Logs viewable by self and partners" on public.logs
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.partnerships 
      where (requester_id = auth.uid() and receiver_email = (select email from profiles where id = logs.user_id) and status = 'accepted')
         or (requester_id = logs.user_id and receiver_email = (select email from profiles where id = auth.uid()) and status = 'accepted')
    )
  );

drop policy if exists "Users can insert own logs" on public.logs;
create policy "Users can insert own logs" on public.logs
  for insert with check (auth.uid() = user_id);

-- Partnerships
drop policy if exists "Partnerships viewable by participants" on public.partnerships;
create policy "Partnerships viewable by participants" on public.partnerships
  for select using (
    auth.uid() = requester_id or 
    receiver_email = (select email from profiles where id = auth.uid())
  );

drop policy if exists "Users can insert partnerships" on public.partnerships;
create policy "Users can insert partnerships" on public.partnerships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "Users can update partnerships sent to them" on public.partnerships;
create policy "Users can update partnerships sent to them" on public.partnerships
  for update using (
    receiver_email = (select email from profiles where id = auth.uid())
  );

-- 6. Replication for Realtime
-- We use a DO block to safely add tables to publication, ignoring errors if they are already added
do $$
begin
  begin
    alter publication supabase_realtime add table public.logs;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.profiles;
  exception when others then null;
  end;

  begin
    alter publication supabase_realtime add table public.partnerships;
  exception when others then null;
  end;
end $$;

-- 7. Trigger to auto-create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, name, pledge_goal)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    160 -- Default goal
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();