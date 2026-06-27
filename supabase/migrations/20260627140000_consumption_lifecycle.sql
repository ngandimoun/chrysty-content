-- Consumption lifecycle: separate generation progress from user consumption tracking

-- 1a. Rename progress -> generation_progress, add archived support
alter table content_creations rename column progress to generation_progress;

alter table content_creations add column if not exists archived_at timestamptz;

alter table content_creations drop constraint if exists content_creations_status_check;
alter table content_creations add constraint content_creations_status_check
  check (status in ('completed', 'draft', 'generating', 'failed', 'archived'));

alter table content_creations drop constraint if exists content_creations_generation_progress_check;
alter table content_creations add constraint content_creations_generation_progress_check
  check (generation_progress is null or (generation_progress >= 0 and generation_progress <= 100));

-- Ensure completed creations have generation_progress = 100
update content_creations
set generation_progress = 100
where status = 'completed' and (generation_progress is null or generation_progress < 100);

-- 1b. Consumption progress (one row per creation + identity)
create table if not exists content_consumption_progress (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references content_creations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content_key text,
  consumption_status text not null default 'not_started' check (
    consumption_status in ('not_started', 'in_progress', 'completed', 'abandoned')
  ),
  progress_percent numeric(5, 2) not null default 0 check (
    progress_percent >= 0 and progress_percent <= 100
  ),
  current_page integer,
  current_position_seconds numeric(12, 3),
  playback_speed numeric(4, 2) not null default 1.0,
  time_spent_seconds integer not null default 0,
  session_count integer not null default 0,
  started_at timestamptz,
  last_opened_at timestamptz,
  last_played_at timestamptz,
  completed_at timestamptz,
  resume_context jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_consumption_progress_identity_check check (
    (user_id is not null and content_key is null)
    or (user_id is null and content_key is not null)
  )
);

create unique index if not exists content_consumption_progress_user_unique
  on content_consumption_progress(creation_id, user_id)
  where user_id is not null;

create unique index if not exists content_consumption_progress_content_key_unique
  on content_consumption_progress(creation_id, content_key)
  where user_id is null and content_key is not null;

create index if not exists content_consumption_progress_content_key_idx
  on content_consumption_progress(content_key);

create index if not exists content_consumption_progress_user_id_idx
  on content_consumption_progress(user_id);

create index if not exists content_consumption_progress_creation_id_idx
  on content_consumption_progress(creation_id);

create index if not exists content_consumption_progress_status_idx
  on content_consumption_progress(consumption_status);

-- 1c. Consumption events (immutable log)
create table if not exists content_consumption_events (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references content_creations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content_key text,
  event_type text not null check (
    event_type in (
      'open', 'close', 'play', 'pause', 'resume', 'seek',
      'page_change', 'bookmark', 'highlight', 'share', 'download', 'complete'
    )
  ),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint content_consumption_events_identity_check check (
    (user_id is not null and content_key is null)
    or (user_id is null and content_key is not null)
  )
);

create index if not exists content_consumption_events_content_key_created_idx
  on content_consumption_events(content_key, created_at desc);

create index if not exists content_consumption_events_user_id_created_idx
  on content_consumption_events(user_id, created_at desc)
  where user_id is not null;

create index if not exists content_consumption_events_creation_id_created_idx
  on content_consumption_events(creation_id, created_at desc);

-- 1d. Annotations (bookmarks, highlights, notes, quotes)
create table if not exists content_consumption_annotations (
  id uuid primary key default gen_random_uuid(),
  creation_id uuid not null references content_creations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content_key text,
  kind text not null check (kind in ('bookmark', 'highlight', 'note', 'quote')),
  page_number integer,
  segment_id text,
  position_seconds numeric(12, 3),
  anchor_text text,
  selected_text text,
  note_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_consumption_annotations_identity_check check (
    (user_id is not null and content_key is null)
    or (user_id is null and content_key is not null)
  )
);

create index if not exists content_consumption_annotations_creation_id_idx
  on content_consumption_annotations(creation_id);

create index if not exists content_consumption_annotations_content_key_idx
  on content_consumption_annotations(content_key);

create index if not exists content_consumption_annotations_user_id_idx
  on content_consumption_annotations(user_id);

-- Triggers for updated_at
drop trigger if exists content_consumption_progress_set_updated_at on content_consumption_progress;
create trigger content_consumption_progress_set_updated_at
  before update on content_consumption_progress
  for each row execute function public.set_updated_at();

drop trigger if exists content_consumption_annotations_set_updated_at on content_consumption_annotations;
create trigger content_consumption_annotations_set_updated_at
  before update on content_consumption_annotations
  for each row execute function public.set_updated_at();

-- Enable RLS (policies added when direct client access is needed)
alter table content_consumption_progress enable row level security;
alter table content_consumption_events enable row level security;
alter table content_consumption_annotations enable row level security;

-- Backfill: seed not_started rows for completed creations
insert into content_consumption_progress (
  creation_id,
  content_key,
  consumption_status,
  progress_percent,
  current_page,
  last_opened_at,
  started_at
)
select
  c.id,
  c.content_key,
  case
    when c.generation_progress is not null
      and c.generation_progress > 0
      and c.generation_progress < 100
      and c.last_opened_at > c.updated_at - interval '1 hour'
    then 'in_progress'
    else 'not_started'
  end,
  case
    when c.generation_progress is not null
      and c.generation_progress > 0
      and c.generation_progress < 100
      and c.last_opened_at > c.updated_at - interval '1 hour'
    then c.generation_progress::numeric(5, 2)
    else 0
  end,
  case
    when c.page_count is not null
      and c.generation_progress is not null
      and c.generation_progress > 0
      and c.generation_progress < 100
      and c.last_opened_at > c.updated_at - interval '1 hour'
    then greatest(1, ceil((c.generation_progress::numeric / 100) * c.page_count)::integer)
    else null
  end,
  c.last_opened_at,
  case
    when c.generation_progress is not null
      and c.generation_progress > 0
      and c.generation_progress < 100
      and c.last_opened_at > c.updated_at - interval '1 hour'
    then c.last_opened_at
    else null
  end
from content_creations c
where c.status = 'completed'
  and not exists (
    select 1 from content_consumption_progress p
    where p.creation_id = c.id and p.content_key = c.content_key
  );
