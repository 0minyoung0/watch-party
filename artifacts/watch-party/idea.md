# Watch Party — Idea One-Pager

## HMW (Problem Restatement)

> **여러 명이 같은 영상을 보면서, 옆에 누군가 있는 것처럼 느끼게 하려면 어떻게 해야 할까?**

축 변경: "URL을 공유한다" → "함께 보고 있다는 느낌을 만든다". URL 편집은 도구일 뿐이고, 진짜 가치는 **동기화·반응·존재감**에서 나온다.

## 확정된 방향

| 축 | 결정 | 의미 |
|---|---|---|
| 동기화 | 방장만 제어, 전원 동기화 | play/pause/seek/URL 변경은 host 권한. viewer는 따라간다. |
| 인증 | 닉네임 입력, 익명 | 가입 없음. 방 입장 시 닉네임만. |
| 백엔드 | Supabase Realtime | DB(방·메시지·재생상태) + Broadcast 채널. |
| 규모 | 비공개 소규모 (2~10명) | 방코드/링크로만 진입. 공개 방 목록 없음. |

## Painkiller vs Vitamin

**Painkiller에 가깝다.** Discord 음성 + 각자 유튜브 재생은 흔한 workaround지만, seek가 어긋나고 "지금 봐!"라는 외침이 따라온다. 동기화된 단일 화면 + 옆 채팅은 그 워크플로우를 바로 대체한다.

단, "친구와 같이 영상을 본다"는 빈도가 사람마다 다르다 — 영화·예능·라이브 분석 같은 **킬러 시청 시나리오가 있는 사용자**에게만 painkiller고, 캐주얼 시청자에겐 vitamin이다.

## 차별성 (정직하게)

기존 서비스가 많은 영역이다 (Watch2gether, Teleparty, Discord Watch Together). **새로운 역량이 아니다 — 차별성 등급 "더 나은 UX"** 수준. 닉네임만으로 즉시 시작할 수 있는 가벼움이 MVP 차별 포인트. 지금은 학습·재미 프로젝트로 보고 진행.

## MVP 범위

**핵심 (반드시):**
- 방 생성 → 6자리 방코드 + 공유 링크 발급
- 방 입장 (방코드/링크 + 닉네임)
- 호스트의 YouTube URL 변경 → 전원 영상 교체
- 호스트의 play/pause/seek → 전원 동기화 (드리프트 보정 포함)
- 텍스트 채팅 (실시간 broadcast, 닉네임 + 메시지)
- 방 멤버 목록 표시 (presence)

**Not Doing (MVP 제외):**
- 회원가입·OAuth·이력 저장
- 공개 방 탐색·방 목록
- 음성/화상
- 호스트 위임·다중 호스트
- 유튜브 외 플랫폼 (Vimeo, Twitch 등)
- 모바일 최적화 (데스크탑 우선)
- 채팅 모더레이션·이모티콘 리액션
- 영상 큐(playlist)
- 방 비밀번호·강퇴

## 가정 분류

### Must Be True — 만들기 전 검증
- **YouTube IFrame Player API로 host의 seek를 viewer에 ±1초 이내로 맞출 수 있다.**
- **Supabase Realtime broadcast 지연이 채팅·재생 동기화 체감상 충분히 낮다 (<300ms 평균).**

### Should Be True — 틀리면 접근 조정
- 사용자는 닉네임만으로 충분히 식별감을 느낀다 (영구 ID 불필요).
- 한 방에 동시에 10명까지 채팅·동기화해도 클라이언트가 버틴다.
- 호스트가 떠나면 방을 종료해도 사용자 불만이 없다.

### Might Be True — 핵심 증명 후 검증
- 모바일에서도 자주 쓸 것이다.
- 영상 큐가 있으면 체류 시간이 늘 것이다.
- 다크모드가 필요하다 (next-themes는 이미 깔려 있으니 거의 공짜).

## 가장 위험한 가정 → MVP 첫 검증 대상

**"YouTube IFrame Player API + Supabase Realtime broadcast로 호스트 ↔ 뷰어 재생 동기화가 부드럽게 작동한다."**

이게 깨지면 제품의 핵심 가치(함께 보는 느낌)가 무너진다. 채팅·UI보다 먼저 이 한 가지를 thin slice로 증명한다.

## 권장 스택

- **Next.js 16 App Router** (이미 셋업됨)
- **Supabase**: `rooms`, `messages`, `playback_state` 테이블 + Realtime channels (broadcast + presence)
- **YouTube IFrame Player API** (클라이언트, 직접 임베드)
- **shadcn/ui + tailwind v4** (이미 셋업됨)
- **Vitest + Playwright** (이미 셋업됨)

## 다음 단계

`/write-spec watch-party` → `artifacts/watch-party/spec.md` 확정
