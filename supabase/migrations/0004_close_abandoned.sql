-- pg_cron extension 활성화 (Supabase에서 기본 제공)
create extension if not exists pg_cron;

-- 30초 이상 host가 heartbeat를 보내지 않은 방 삭제 함수
create or replace function close_abandoned_rooms()
returns void
language sql
as $$
  delete from rooms
  where last_host_seen_at < now() - interval '30 seconds';
$$;

-- 5초 주기로 실행 (최소 단위 1분이므로 pg_cron은 1분 주기로 실행)
-- 실제로는 cron.schedule로 60초 주기가 최소. 30초 grace면 충분
select cron.schedule(
  'close-abandoned-rooms',
  '* * * * *',
  'select close_abandoned_rooms()'
);
