-- RLS 활성화
alter table rooms enable row level security;
alter table members enable row level security;
alter table messages enable row level security;
alter table playback_state enable row level security;

-- rooms: anon은 select/insert/update 허용 (방 생성, 참여, heartbeat)
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true);
create policy "rooms_delete" on rooms for delete using (true);

-- members: anon은 select/insert/update/delete 허용 (닉네임 익명성, leaveRoom)
create policy "members_select" on members for select using (true);
create policy "members_insert" on members for insert with check (true);
create policy "members_update" on members for update using (true);
create policy "members_delete" on members for delete using (true);

-- messages: anon은 select/insert 허용
create policy "messages_select" on messages for select using (true);
create policy "messages_insert" on messages for insert with check (true);

-- playback_state: anon은 select/insert/update 허용
create policy "playback_select" on playback_state for select using (true);
create policy "playback_insert" on playback_state for insert with check (true);
create policy "playback_update" on playback_state for update using (true);

-- 방 정원 10명 DB 레벨 강제 trigger
create or replace function check_room_capacity()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from members where room_code = new.room_code) >= 10 then
    raise exception 'room_full';
  end if;
  return new;
end;
$$;

create trigger trg_room_capacity
  before insert on members
  for each row execute function check_room_capacity();
