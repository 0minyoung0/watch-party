# Watch Party — Learnings

---
category: task-ordering
applied: not-yet
---
## Task 실행 순서 결정

**상황**: Step 2, plan.md 의존성 분석
**판단**: plan.md의 Task 순서(1→2→3→4→5→6→7→8)를 그대로 따른다. Task 1이 rooms+members 테이블을 동시에 생성하므로 FK 순서 문제가 없다. Task 2는 추가 migration 없이 viewer join API + realtime만 담당.
**다시 마주칠 가능성**: 낮음 — plan.md에 이미 명시됨
