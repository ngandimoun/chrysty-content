-- Content worker schema for chrysty.dev (isolated from other workers)
-- Chrysty Creative Library: stories, podcasts, audiobooks

create extension if not exists "pgcrypto";

insert into public.workers (slug, name, status)
values ('content', 'Chrysty Creative Library', 'active')
on conflict (slug) do update
  set name = excluded.name,
      status = excluded.status;

create table if not exists content_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  platform_workspace_id uuid references worker_workspaces(id) on delete set null,
  name text not null default 'My Library',
  visitor_token text not null default ('vis_' || replace(gen_random_uuid()::text, '-', '')),
  content_key text not null,
  settings jsonb not null default '{}',
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_workspaces_visitor_token_unique
  on content_workspaces(visitor_token);

create unique index if not exists content_workspaces_content_key_unique
  on content_workspaces(content_key);

create index if not exists content_workspaces_user_id_idx
  on content_workspaces(user_id);

create unique index if not exists content_workspaces_user_default_unique
  on content_workspaces(user_id) where is_default = true and user_id is not null;

create table if not exists content_creations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references content_workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content_key text not null,
  title text not null,
  type text not null,
  category text not null check (category in ('story', 'audiobook', 'podcast')),
  content_subtype text,
  status text not null default 'draft' check (
    status in ('completed', 'draft', 'generating', 'failed')
  ),
  topic text,
  description text,
  tags text[] not null default '{}',
  artwork_gradient text not null default 'from-violet-400 via-purple-500 to-indigo-600',
  duration_minutes integer,
  page_count integer,
  progress integer check (progress is null or (progress >= 0 and progress <= 100)),
  is_favorite boolean not null default false,
  setup jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now()
);

create index if not exists content_creations_workspace_id_idx
  on content_creations(workspace_id);

create index if not exists content_creations_content_key_idx
  on content_creations(content_key);

create index if not exists content_creations_content_key_updated_idx
  on content_creations(content_key, updated_at desc);

create index if not exists content_creations_content_key_last_opened_idx
  on content_creations(content_key, last_opened_at desc);

create index if not exists content_creations_status_idx
  on content_creations(status);

create table if not exists content_creation_assets (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references content_creations(id) on delete cascade,
  content_key text not null,
  asset_type text not null check (
    asset_type in ('audio', 'cover', 'script', 'source')
  ),
  storage_bucket text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists content_creation_assets_creation_id_idx
  on content_creation_assets(creation_id);

create index if not exists content_creation_assets_content_key_idx
  on content_creation_assets(content_key);

create table if not exists content_activity (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references content_creations(id) on delete cascade,
  content_key text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists content_activity_content_key_created_idx
  on content_activity(content_key, created_at desc);

create index if not exists content_activity_creation_id_idx
  on content_activity(creation_id);

drop trigger if exists content_workspaces_set_updated_at on content_workspaces;
create trigger content_workspaces_set_updated_at
  before update on content_workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists content_creations_set_updated_at on content_creations;
create trigger content_creations_set_updated_at
  before update on content_creations
  for each row execute function public.set_updated_at();

alter table content_workspaces enable row level security;
alter table content_creations enable row level security;
alter table content_creation_assets enable row level security;
alter table content_activity enable row level security;
