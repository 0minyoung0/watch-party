-- rooms 테이블 (members보다 먼저 — FK 참조 방향)
create table if not exists rooms (
  code text primary key,
  host_member_id uuid,
  video_id text,
  last_host_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- members 테이블
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references rooms(code) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  is_host boolean not null default false,
  joined_at timestamptz not null default now()
);

-- rooms.host_member_id → members.id FK (순환 참조지만 nullable이라 OK)
alter table rooms
  add constraint fk_rooms_host_member
  foreign key (host_member_id)
  references members(id)
  on delete set null;

-- Realtime 활성화
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table members;
