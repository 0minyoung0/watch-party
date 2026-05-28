create table if not exists playback_state (
  room_code text primary key references rooms(code) on delete cascade,
  video_id text,
  is_playing boolean not null default false,
  position_seconds numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter publication supabase_realtime add table playback_state;
