# Watch Party 구현 계획

## Context

idea/spec/wireframe까지 확정된 상태에서 실제 동작하는 MVP로 만든다. 핵심 가설은 "가입 없이 닉네임만으로 즉시 합류해 YouTube 영상을 함께 본다 + 채팅"이라는 가벼움이 painkiller라는 것 — 따라서 회원가입·다중 플랫폼·모더레이션·playlist는 모두 제외하고, host 중심의 단일 영상 동기화 + 텍스트 채팅 + presence + 호스트 이탈 시 정리까지를 end-to-end로 구현한다.

전제: 코드베이스는 Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui (Field/InputGroup/Card/Button 등 설치 완료) + Vitest + Playwright. Supabase 플러그인은 활성화돼 있으나 SDK 설치 및 프로젝트 wire-up은 Task 1에서 한다.

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 상태 저장소 | Postgres 테이블 + Realtime postgres_changes | viewer 재접속·드리프트 보정 시 현재 host 상태를 단순 SELECT로 가져올 수 있음. 방 종료 시 row 삭제로 휘발성 보장 (spec 불변 규칙) |
| 호스트 이탈 강제 종료 | Supabase Edge Function + pg_cron (1초 주기) | 클라이언트 합의는 동시성 edge case가 많음. 서버가 `last_host_seen_at`을 보고 30초 초과 row 정리 |
| 세션 지속 | sessionStorage `{roomCode, nickname, memberId, isHost}` (host/viewer 공통) | 새로고침에는 살아 있고 탭 닫으면 사라짐 — 휘발성 컨셉과 일치. host도 같은 메커니즘으로 30초 grace 내 재진입 |
| 네트워크 단절 (Scenario 9) | Supabase Realtime client 내장 auto-reconnect에 의존 | 짧은 단절은 client 재구독이 처리 — 별도 코드 불필요 |
| 재생 제어 전달 | Realtime broadcast 채널 (play/pause/seek/url_change) + DB `playback_state` (truth source) | broadcast는 저지연(300ms 목표), DB는 재접속 시 현재 상태 복원용 (write-through) |
| YouTube 플레이어 | IFrame Player API (`https://www.youtube.com/iframe_api`) 클라이언트 임베드 | spec 의존성에 명시. 별도 npm 패키지 없이 `<script>` 동적 로드 |
| URL 검증 | `lib/youtube-url.ts` 단일 파서 — `watch?v=` / `youtu.be/` 두 형식만 허용 | spec 불변 규칙의 입력 제약과 1:1 |
| 닉네임 입력 | shadcn `Field` + `Input`, 버튼 disabled 조건은 controlled state | shadcn-guard 규칙: form에 raw `div` 금지 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| Supabase 프로젝트 | DB + Realtime | `.env.local` (URL, anon key) | Task 1 |
| `rooms` 테이블 | Postgres table | Supabase migration `supabase/migrations/0001_init.sql` | Task 1 |
| `members` 테이블 | Postgres table | 동상 | Task 2 |
| `messages` 테이블 | Postgres table | 동상 | Task 6 |
| `playback_state` 테이블 | Postgres table | 동상 | Task 3 |
| Realtime 활성화 | postgres_changes publication | migration | Task 1-6 |
| `close-abandoned-rooms` Edge Function | scheduled function | `supabase/functions/close-abandoned-rooms/index.ts` | Task 7 |
| pg_cron schedule (1초) | cron job | migration | Task 7 |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + `.env.example` | Task 1 |

## 데이터 모델

### Room
- `code` (text, PK, 6-digit)
- `host_member_id` (uuid, FK → members.id, nullable until member created)
- `video_id` (text, nullable — null이면 wireframe "URL을 입력하세요" 상태)
- `last_host_seen_at` (timestamptz, host heartbeat용)
- `created_at` (timestamptz)

### Member
- `id` (uuid, PK)
- `room_code` (text, FK → rooms.code, on delete cascade)
- `nickname` (text, 1-20자)
- `is_host` (bool)
- `joined_at` (timestamptz)

### Message
- `id` (uuid, PK)
- `room_code` (text, FK → rooms.code, on delete cascade)
- `member_id` (uuid, FK → members.id)
- `nickname` (text, denormalized — member 떠나도 표시 유지)
- `content` (text)
- `created_at` (timestamptz)

### PlaybackState
- `room_code` (text, PK, FK → rooms.code, on delete cascade)
- `video_id` (text, nullable)
- `is_playing` (bool)
- `position_seconds` (numeric)
- `updated_at` (timestamptz)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | 모든 UI Task | Field/InputGroup/Card/Button 합성. `components/ui/*` 직접 수정 금지 |
| next-best-practices | Task 1, 2, 7 | App Router 페이지 구조, async params, server vs client component 경계 |
| supabase | Task 1 외 모든 Task | Supabase client 생성, migration, RLS, Realtime 구독, Edge Function |
| supabase-postgres-best-practices | Task 1, 7 | 인덱스, FK on delete cascade, RLS 정책 |
| vercel-react-best-practices | Task 3, 4 | 클라이언트 컴포넌트의 effect 경계, ref 사용 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `package.json` | Modify (deps: @supabase/supabase-js) | 1 |
| `.env.example` | New | 1 |
| `supabase/migrations/0001_init.sql` | New | 1 |
| `supabase/migrations/000N_*.sql` | New (테이블별) | 2, 3, 6, 7 |
| `supabase/functions/close-abandoned-rooms/index.ts` | New | 7 |
| `types/room.ts`, `types/member.ts`, `types/message.ts`, `types/playback.ts` | New | 각 Task |
| `lib/supabase/client.ts`, `lib/supabase/server.ts` | New | 1 |
| `lib/youtube-url.ts` (+ `.test.ts`) | New | 1, 3 |
| `lib/room-code.ts` (+ `.test.ts`) | New | 1 |
| `services/rooms.ts`, `services/members.ts`, `services/messages.ts`, `services/playback.ts` | New | 각 Task |
| `hooks/use-room.ts`, `hooks/use-members.ts`, `hooks/use-chat.ts`, `hooks/use-playback-sync.ts`, `hooks/use-host-heartbeat.ts`, `hooks/use-session.ts` | New | 각 Task |
| `components/watch-party/landing-create.tsx`, `landing-join.tsx`, `room-shell.tsx`, `player.tsx`, `url-changer.tsx`, `member-list.tsx`, `chat-panel.tsx`, `room-closed.tsx`, `host-disconnected-banner.tsx` (+ colocated `.test.tsx`) | New | 각 Task |
| `app/page.tsx` | Modify (landing 진입) | 1 |
| `app/room/[code]/page.tsx` | New | 1 |
| `app/room/[code]/closed/page.tsx` | New | 7 |
| `e2e/watch-party.spec.ts` | New | 8 (전체 시나리오 통합) |

## Tasks

### ~~Task 1: 랜딩에서 방 만들기 → 방 화면에 코드 표시 (rooms + members 동시 생성)~~ ✅

- **담당 시나리오**: Scenario 1 (full)
- **크기**: M (5+ 파일 — 인프라 셋업 포함이라 예외적으로 큼. 분할 어려움: types/lib/services/page가 한 슬라이스로 묶여야 end-to-end로 동작)
- **의존성**: None
- **노트**: `rooms`와 `members` 테이블을 함께 생성한다 (FK 순서 문제 회피). `createRoom`은 트랜잭션 안에서 rooms insert → host members insert → `rooms.host_member_id` 채우기 순으로 처리. Task 2는 추가 마이그레이션 없이 viewer join API + realtime 구독만 담당.
- **참조**:
  - shadcn — Field, FieldGroup, Input, Button, Card
  - next-best-practices — `app/page.tsx`는 client component (form 상태 필요)
  - supabase — anon key client 생성, migration 적용
- **구현 대상**:
  - `package.json` (add `@supabase/supabase-js`)
  - `.env.example`, `.env.local` 가이드
  - `supabase/migrations/0001_init.sql` (rooms + members 테이블 + 닉네임 CHECK(length between 1 and 20) + Realtime publication)
  - `types/room.ts`, `types/member.ts`
  - `lib/supabase/client.ts`
  - `lib/youtube-url.ts` (+ colocated test — `parseYouTubeUrl`이 `watch?v=ID` / `youtu.be/ID`만 허용)
  - `lib/room-code.ts` (+ test — 6자리 숫자 생성, 0-leading 허용)
  - `services/rooms.ts` (`createRoom({ nickname, videoId? })`)
  - `components/watch-party/landing-create.tsx` (+ test — 닉네임 빈칸이면 버튼 disabled, URL 검증 에러 표시)
  - `app/page.tsx` (랜딩 진입, 카드 두 개 중 '방 만들기' 카드만 — Task 2에서 입장 카드 추가)
  - `app/room/[code]/page.tsx` (방 셸 — 코드/링크 표시까지만)
- **수용 기준**:
  - [ ] 닉네임 `민영` + URL `https://youtu.be/dQw4w9WgXcQ` 입력 후 '방 만들기' 클릭 → URL에 6자리 숫자 방코드 포함된 `/room/<code>`로 이동
  - [ ] 방 화면에 방코드와 공유 링크(`<origin>/room/<code>`)가 표시됨
  - [ ] URL을 비우고 생성 → 방 화면 player 영역에 '`URL을 입력하세요`' 안내가 표시됨
  - [ ] URL `https://example.com/x` 입력 후 '방 만들기' → '`유효하지 않은 YouTube URL`' 표시, 페이지 이동 없음
  - [ ] 닉네임이 비어 있는 동안 '방 만들기' 버튼이 disabled
  - [ ] 닉네임 21자 이상 입력 시 입력이 20자로 잘리거나 버튼이 disabled (input maxLength=20 + DB CHECK)
- **검증**:
  - `bun run test -- lib/youtube-url lib/room-code components/watch-party/landing-create`
  - `bun run build`
  - Browser MCP — `/` → 폼 입력 → 방 화면 진입 확인, 증거 `artifacts/watch-party/evidence/task-1.png`

---

### ~~Task 2: viewer 입장 → 멤버 목록 realtime 동기화~~ ✅

- **담당 시나리오**: Scenario 2 (full), Scenario 7 (full)
- **크기**: M (4 파일)
- **의존성**: Task 1 (rooms 테이블, 방 화면 셸)
- **참조**:
  - supabase — Realtime postgres_changes 구독, `on('postgres_changes', ...)`
  - shadcn-guard — list는 `Card` + `flex flex-col gap-*`
- **구현 대상**:
  - (migration 없음 — rooms+members는 Task 1에서 생성됨)
  - `services/members.ts` (`joinRoom`, `leaveRoom`, `listMembers`)
  - `hooks/use-members.ts` (room_code 기반 실시간 구독)
  - `components/watch-party/landing-join.tsx` (+ test)
  - `components/watch-party/member-list.tsx` (+ test — host 배지 시각적 구분)
  - `app/page.tsx` (입장 카드 추가, 공유 링크 `?code=` query로 prefill)
  - `app/room/[code]/page.tsx` (멤버 목록 카드 마운트)
- **수용 기준**:
  - [ ] 기존 host 방에 닉네임 `철수` + 방코드 입력 → `/room/<code>` 진입, 멤버 목록에 `철수` 추가
  - [ ] host 화면의 멤버 목록에도 `철수`가 1초 이내 표시됨
  - [ ] 존재하지 않는 방코드 `999999` 입장 시 '`방을 찾을 수 없음`' 표시, 페이지 이동 없음
  - [ ] 10명 멤버가 있는 방에 11번째 입장 시도 → '`방이 가득 찼습니다`'
  - [ ] 닉네임 21자 이상 입력 시 입력이 20자로 잘리거나 버튼이 disabled (landing-join에서도 동일)
  - [ ] 공유 링크 `/room/483210?join=1`로 진입 시 입장 카드의 방코드 필드가 `483210`으로 채워지고 readonly
  - [ ] viewer 탭 닫기 → 다른 멤버 화면의 멤버 목록에서 수 초 이내 해당 닉네임 사라짐
  - [ ] 호스트 행에 시각적 배지(예: `HOST` 라벨) 표시
- **검증**:
  - `bun run test -- members landing-join member-list`
  - Browser MCP — 두 탭으로 host/viewer 검증, 증거 `artifacts/watch-party/evidence/task-2.gif`

---

### Checkpoint A: Task 1-2 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] host가 방을 만들고 viewer가 입장해 멤버 목록에 양쪽이 모두 보인다 (영상·채팅 없는 빈 셸)

---

### Task 3: YouTube 플레이어 임베드 + host URL 교체

- **담당 시나리오**: Scenario 3 (full), Scenario 1 (player 로드 부분)
- **크기**: M (4 파일)
- **의존성**: Task 1 (rooms.video_id), Task 2 (host 식별)
- **참조**:
  - vercel-react-best-practices — IFrame API 동적 로드는 effect, ref로 player 인스턴스 관리
  - YouTube IFrame Player API — https://developers.google.com/youtube/iframe_api_reference
- **구현 대상**:
  - `supabase/migrations/0002_playback.sql` (playback_state 테이블)
  - `types/playback.ts`
  - `services/playback.ts` (`setVideo`, `getState`)
  - `components/watch-party/player.tsx` (+ test — host/viewer 모드 prop으로 분기)
  - `components/watch-party/url-changer.tsx` (+ test — host에만 마운트)
- **수용 기준**:
  - [ ] host가 URL 입력란에 `https://www.youtube.com/watch?v=NEWID123` 입력 후 '적용' → host 화면 영상이 새 영상으로 교체, 0초 멈춤
  - [ ] 같은 시점에 viewer 화면도 새 영상으로 교체, 0초 멈춤 (postgres_changes 구독)
  - [ ] '적용'을 누르기 전 입력 중에는 viewer 화면 변화 없음
  - [ ] host가 `https://example.com/bad` 입력 후 '적용' → host 화면에 '`유효하지 않은 YouTube URL`', 영상 교체 안 됨
  - [ ] viewer 화면에는 URL 입력란이 마운트되지 않음
- **검증**:
  - `bun run test -- player url-changer`
  - Browser MCP — host/viewer 두 탭에서 교체 동작 확인

---

### Task 4: host 재생 제어가 viewer에 반영 (play/pause/seek)

- **담당 시나리오**: Scenario 4 (full)
- **크기**: M (3 파일)
- **의존성**: Task 3 (player 인스턴스)
- **참조**:
  - supabase — Realtime broadcast 채널 (low-latency, 저장 안 됨), DB write-through
  - YouTube IFrame API — `playVideo`, `pauseVideo`, `seekTo`, `onStateChange`
- **구현 대상**:
  - `services/playback.ts` 확장 (`broadcastControl`, write-through to playback_state)
  - `hooks/use-playback-sync.ts` (host: player events → broadcast + DB write / viewer: broadcast subscribe → player apply)
  - `components/watch-party/player.tsx` 수정 (viewer는 player 컨트롤 노출 OK, 호스트 권한 제약은 sync hook이 host state로 되돌림)
- **수용 기준**:
  - [ ] host가 play 클릭 → viewer 2명의 영상이 평균 300ms 이내 play
  - [ ] host가 pause → viewer도 평균 300ms 이내 pause
  - [ ] host가 60초로 seek → viewer 영상도 60초로 점프
  - [ ] viewer가 자기 컨트롤로 일시정지해도 다른 멤버에 영향 없음, 본인 화면도 host 상태로 되돌아옴 (1-2초 내)
- **검증**:
  - `bun run test -- use-playback-sync` (broadcast mock으로 host→viewer 적용 단위 테스트)
  - Human review — 두 탭에서 체감 지연 측정. 증거: 영상 캡처 `artifacts/watch-party/evidence/task-4.mp4`, 리뷰어 `minyoung.jeong@lge.com`, 기준 "체감상 동시 재생"

---

### Task 5: 드리프트 자동 보정

- **담당 시나리오**: Scenario 5 (full)
- **크기**: S (1 파일 — Task 4 hook 확장)
- **의존성**: Task 4
- **참조**:
  - YouTube IFrame API — `getCurrentTime()`, `seekTo(seconds, true)`
- **구현 대상**:
  - `hooks/use-playback-sync.ts` 확장 (viewer 측 2초 주기 비교 + 1초 초과 시 silent seek)
  - colocated test
- **수용 기준**:
  - [ ] viewer가 host보다 13초/host 10초로 ±3초 어긋난 상태 시뮬레이션 → 다음 tick에서 viewer가 host 위치로 seek되어 ±1초 이내
  - [ ] 보정 중 viewer 화면에 추가 스피너·텍스트 없음 (DOM에 새 노드 추가되지 않음)
- **검증**:
  - `bun run test -- use-playback-sync` (fake player ref + 시간 어긋남 시뮬레이션)

---

### Checkpoint B: Task 3-5 이후
- [ ] 모든 테스트 통과
- [ ] 빌드 성공
- [ ] host가 URL을 바꾸고 play/pause/seek하면 viewer가 동기화되며, 의도적으로 viewer 시간을 어긋나게 해도 자동 보정된다

---

### Task 6: 채팅

- **담당 시나리오**: Scenario 6 (full)
- **크기**: M (3 파일)
- **의존성**: Task 2 (member 식별)
- **참조**:
  - shadcn — InputGroup + InputGroupAddon (전송 버튼은 input 내부)
  - supabase — messages 테이블 + Realtime + 입장 시점 timestamp 필터
- **구현 대상**:
  - `supabase/migrations/0003_messages.sql`
  - `types/message.ts`
  - `services/messages.ts` (`sendMessage`, `listMessagesSince`)
  - `hooks/use-chat.ts` (member.joined_at 이후 메시지만 노출)
  - `components/watch-party/chat-panel.tsx` (+ test)
- **수용 기준**:
  - [ ] viewer `철수`가 `안녕` 전송 → host와 다른 viewer의 채팅 영역에 평균 300ms 이내 `철수: 안녕` 표시
  - [ ] 입력란이 비어 있으면 전송 버튼 disabled (또는 클릭해도 무시)
  - [ ] 메시지에 발신자 닉네임이 함께 표시됨
  - [ ] 대화 진행 중에 신규 viewer 입장 → 입장 이전 메시지는 그의 화면에 보이지 않음
- **검증**:
  - `bun run test -- chat-panel use-chat`
  - Browser MCP — 두 탭 채팅, 세 번째 탭 늦은 입장으로 백필 미노출 확인

---

### Task 7: 호스트 이탈 감지 + 30초 grace + 방 종료 화면

- **담당 시나리오**: Scenario 8 (full)
- **크기**: M (5 파일)
- **의존성**: Task 2 (멤버), Task 6 (방 안에 콘텐츠)
- **참조**:
  - supabase — Edge Functions (Deno), pg_cron
  - `rooms.last_host_seen_at` heartbeat 컬럼
- **구현 대상**:
  - `supabase/migrations/0004_close_abandoned.sql` (pg_cron 1초 schedule + RPC `close_abandoned_rooms`)
  - `supabase/functions/close-abandoned-rooms/index.ts` (대안: SQL RPC만으로 처리 가능하면 Edge Function 생략 — 단순 DELETE FROM rooms WHERE last_host_seen_at < now() - interval '30 seconds')
  - `hooks/use-host-heartbeat.ts` (host만 마운트, 5초 주기 last_host_seen_at update)
  - `hooks/use-room.ts` 확장 (room row DELETE 감지 → 종료 상태)
  - `components/watch-party/host-disconnected-banner.tsx` (+ test — host 부재 25초/30초 카운트다운)
  - `app/room/[code]/closed/page.tsx` + `components/watch-party/room-closed.tsx` (+ test)
- **수용 기준**:
  - [ ] host 탭 닫음 → viewer 화면 상단에 '`호스트 연결이 끊겼습니다`' 배너 표시 (heartbeat 끊김 감지 즉시, 약 5-10초)
  - [ ] host가 30초 안에 새로고침 → sessionStorage `isHost=true` + memberId 복원으로 자동 재진입, 배너 사라지고 정상 시청 (Task 8의 host reattach와 같은 메커니즘)
  - [ ] host가 30초 안에 돌아오지 않음 → cron이 room row 삭제 → viewer 전원이 `/room/<code>/closed`로 이동
  - [ ] 종료된 방코드로 새 입장 시도 → '`방을 찾을 수 없음`'
  - [ ] 종료 화면에서 '랜딩으로 돌아가기' 버튼 클릭 → `/` 이동
- **검증**:
  - `bun run test -- host-disconnected-banner room-closed`
  - SQL — `SELECT * FROM close_abandoned_rooms()` 직접 실행, 더미 row가 정리되는지 확인
  - Browser MCP — host/viewer 두 탭, host 닫고 30초 대기, viewer가 종료 화면으로 이동하는지 녹화 `artifacts/watch-party/evidence/task-7.gif`

---

### Task 8: viewer 재접속 (sessionStorage) + Playwright E2E

- **담당 시나리오**: Scenario 9 (full)
- **크기**: M (3 파일 + e2e)
- **의존성**: Task 2-7
- **참조**:
  - 브라우저 sessionStorage API
- **구현 대상**:
  - `hooks/use-session.ts` (`{roomCode, nickname, memberId, isHost}` 읽기·쓰기, 입장 직후 저장)
  - `app/room/[code]/page.tsx` 수정 (마운트 시 session 있으면 자동 재입장, 없으면 `/?code=...&join=1` 리다이렉트)
  - `services/members.ts` 확장 (`reattach(memberId, roomCode, nickname, isHost)` — row 존재하면 그대로, 삭제됐으면 새 insert)
  - `e2e/watch-party.spec.ts` (전체 happy path: 방 생성 → 입장 → 영상 동기 → 채팅 → 새로고침 재접속 → 호스트 이탈 종료)
- **수용 기준**:
  - [ ] viewer 입장 후 새로고침 → 별도 입력 없이 방 화면 진입
  - [ ] 재입장한 viewer는 host 현재 재생 위치로 동기화 (Task 5의 보정으로 자연스럽게 수렴)
  - [ ] 재입장한 viewer 채팅에는 단절 동안의 메시지가 보이지 않음 (joined_at 갱신)
  - [ ] 방이 그 사이 종료된 경우 새로고침 후 `/room/<code>/closed`로 이동 (not-found도 동일)
  - [ ] 네트워크가 일시 단절(30초 미만) 됐다 복구되면 Supabase Realtime client가 자동 재구독 — 별도 안내 UI 없음 (Realtime auto-reconnect 의존)
- **검증**:
  - `bun run test -- use-session`
  - `bun run test:e2e -- watch-party`
  - Browser MCP — viewer 새로고침 시 재진입 녹화

---

### Checkpoint C: Task 6-8 이후 (최종)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] E2E 통과: `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] spec의 9개 시나리오 모두가 두 탭 수동 시나리오로 재현 가능

## 미결정 항목

- Supabase Edge Function vs 순수 SQL RPC + pg_cron — Task 7 구현 시점에 SQL만으로 충분하면 Edge Function은 생략. 결정은 Task 7 진입 시 SUPABASE 환경(local CLI / cloud)을 보고 선택
- RLS 정책 세부 — anon key + room_code 검증으로 충분한지, signed JWT를 둘지. Task 1 진입 시 supabase 스킬 가이드와 함께 결정
