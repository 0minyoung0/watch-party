create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  nickname text not null,
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index idx_messages_room_code_created_at on messages(room_code, created_at);

alter publication supabase_realtime add table messages;
