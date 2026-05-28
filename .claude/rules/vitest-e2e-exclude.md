# Vitest + Playwright 공존 시 e2e 폴더 exclude 필수

## 규칙

Vitest와 Playwright가 같은 프로젝트에 공존할 때, `vitest.config.ts`의 `test.exclude`에 `"e2e/**"`를 명시적으로 추가해야 한다.

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    exclude: ["node_modules/**", "e2e/**"], // e2e 필수 추가
  },
});
```

**Why:** Vitest는 기본적으로 `e2e/*.spec.ts` 파일을 발견해 실행을 시도한다. Playwright의 `test()` 함수는 Vitest context에서 호출되면 `"Playwright Test did not expect test() to be called here"` 에러로 실패한다. `bun run test`가 항상 실패하게 되어 CI/CD가 막힌다.

**How to apply:** Next.js 프로젝트 초기 셋업 시 Playwright를 추가하는 순간 바로 적용. `playwright.config.ts`의 `testDir`가 `"./e2e"`이면 반드시 Vitest에서도 같은 경로를 exclude.
