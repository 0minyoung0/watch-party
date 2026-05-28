# Watch Party — Learnings

---
category: task-ordering
applied: discarded
---
## Task 실행 순서 결정

**상황**: Step 2, plan.md 의존성 분석
**판단**: plan.md의 Task 순서(1→2→3→4→5→6→7→8)를 그대로 따른다. plan.md가 이미 순서를 명시함.
**다시 마주칠 가능성**: 낮음 — 일회성

---
category: tooling
applied: not-yet
---
## @types/youtube 설치 필요

**상황**: Task 3, YT.Player 타입 사용 시 빌드 실패
**판단**: YouTube IFrame API를 쓸 때 `@types/youtube`를 함께 설치해야 한다. `declare global`에서 `typeof YT` 참조 시 UMD global 충돌 — `any` 캐스팅 또는 ambient declaration 파일로 해결.
**다시 마주칠 가능성**: 높음 — YouTube IFrame API를 사용하는 모든 프로젝트에서 반복됨

---
category: tooling
applied: rule → .claude/rules/vitest-e2e-exclude.md
---
## vitest가 e2e 폴더를 잡지 않도록 exclude 필요

**상황**: Task 8, `bun run test` 실행 시 e2e/*.spec.ts를 Vitest가 실행 시도
**판단**: vitest.config.ts의 exclude에 `"e2e/**"` 추가 필요. Playwright 테스트와 Vitest 테스트가 공존할 경우 항상 설정해야 함.
**다시 마주칠 가능성**: 높음 — Next.js + Playwright + Vitest 스택 모두 해당

---
category: tooling
applied: not-yet
---
## jsdom에서 scrollIntoView polyfill 필요

**상황**: Task 6, chat-panel 테스트에서 `scrollIntoView is not a function` 에러
**판단**: `vitest.setup.ts`에 `window.HTMLElement.prototype.scrollIntoView = () => {}` 추가 필요
**다시 마주칠 가능성**: 높음 — scroll 관련 컴포넌트 테스트에서 항상 발생

---
category: spec-ambiguity
applied: not-yet
---
## YouTube videoId 길이 제약 완화

**상황**: Task 3, url-changer 테스트에서 spec 예시 URL의 videoId가 8자(NEWID123) — regex는 11자 강제
**판단**: spec 예시를 따라 regex를 `[a-zA-Z0-9_-]+`(1자 이상)로 완화. 실제 YouTube ID는 11자이지만 spec 범위에 길이 제약은 없음.
**다시 마주칠 가능성**: 낮음 — spec 예시가 실제 제약을 반영하지 않는 케이스

---
category: code-review
applied: rule → .claude/rules/supabase-broadcast.md
---
## Supabase broadcast: subscribe 없이 send 불가

**상황**: Step 4 코드 리뷰 [C1], `broadcastControl`이 독립 채널로 send → viewer 미수신
**판단**: Supabase JS v2에서 `.channel().send()`는 해당 채널이 subscribe되어 있어야 전달됨. host가 send할 때 viewer가 subscribe한 채널 인스턴스와 같은 것이어야 함. `use-playback-sync` 내부에서 subscribe된 채널 ref를 통해 send하도록 수정.
**다시 마주칠 가능성**: 높음 — Supabase Realtime broadcast를 사용하는 모든 feature에서 반복 가능

---
---
category: regression
applied: not-yet
---
## ref 기반 host 위치 동기화에 timestamp를 함께 기록해야 한다

**상황**: watch-party 수동 테스트, host 50초에서 play 클릭 → viewer가 51, 52, 53초로 진행 중 드리프트 보정이 계속 50초로 seek-back
**판단**: `hostPositionRef.current`는 마지막 이벤트 시점 값으로 고정, 시간이 흘러도 advance되지 않음. viewer 보정 루프가 `Math.abs(current - 50) > 1`로 판단해 무한 seek-back. 수정: `hostPositionTimestampRef`(Date.now())를 함께 기록하고, 보정 루프에서 `expected = hostPosition + (Date.now() - timestamp) / 1000`으로 시간 흐름을 추정.
**다시 마주칠 가능성**: 높음 — realtime 위치 동기화 로직에서 "마지막 알려진 상태"를 고정값으로만 쓰는 패턴은 같은 문제를 낳음

---
category: code-review
applied: not-yet
---
## RLS 없이 anon key 노출 = 전테이블 오픈

**상황**: Step 4 코드 리뷰 [C4], NEXT_PUBLIC_SUPABASE_ANON_KEY 노출 자체는 정상이나 RLS 없으면 누구든 전테이블 조작 가능
**판단**: migration 0005에서 RLS 활성화 + anon 정책 추가. MVP 단계에서는 permissive 정책이지만 인증 도입 시 강화 필요.
**다시 마주칠 가능성**: 높음 — Supabase 프로젝트 생성 시 RLS 기본 비활성화이므로 항상 확인 필요

---
category: code-review
applied: not-yet
---
## DB trigger로 정원 제한 강제

**상황**: Step 4 코드 리뷰 [C3], 클라이언트 count-then-insert는 race condition
**판단**: `BEFORE INSERT ON members` trigger로 count >= 10 시 예외 발생. 클라이언트 체크는 UX용 선행 검증, DB는 실제 강제용으로 두 레이어 사용.
**다시 마주칠 가능성**: 높음 — 정원/quota 제한이 있는 모든 기능에서 동일 패턴 필요
