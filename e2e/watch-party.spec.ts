import { test, expect, type Page } from "@playwright/test";

async function createRoom(page: Page, nickname: string, url?: string) {
  await page.goto("/");
  await page.getByLabel(/닉네임/).first().fill(nickname);
  if (url) await page.getByLabel(/YouTube URL/).fill(url);
  await page.getByRole("button", { name: /방 만들기/ }).click();
  await page.waitForURL(/\/room\/\d{6}$/);
  const code = page.url().split("/").pop()!;
  return code;
}

async function joinRoom(page: Page, code: string, nickname: string) {
  await page.goto(`/?code=${code}`);
  await page.getByLabel(/닉네임/).nth(1).fill(nickname);
  await page.getByRole("button", { name: /입장/ }).click();
  await page.waitForURL(`/room/${code}`);
}

test("Scenario 1: 방 생성 → 방코드 표시", async ({ page }) => {
  const code = await createRoom(page, "민영", "https://youtu.be/dQw4w9WgXcQ");
  expect(code).toMatch(/^\d{6}$/);
  await expect(page.getByText(code)).toBeVisible();
});

test("Scenario 1: URL 없이 방 생성 → URL 입력 안내", async ({ page }) => {
  await createRoom(page, "민영");
  await expect(page.getByText(/URL을 입력하세요/)).toBeVisible();
});

test("Scenario 1: 닉네임 빈칸이면 버튼 disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /방 만들기/ })).toBeDisabled();
});

test("Scenario 2: viewer 입장 → 멤버 목록", async ({ browser }) => {
  const hostCtx = await browser.newContext();
  const viewerCtx = await browser.newContext();
  const hostPage = await hostCtx.newPage();
  const viewerPage = await viewerCtx.newPage();

  const code = await createRoom(hostPage, "민영");
  await joinRoom(viewerPage, code, "철수");

  // viewer 화면에 멤버 목록 표시
  await expect(viewerPage.getByText("철수")).toBeVisible();

  // host 화면에도 철수 표시
  await expect(hostPage.getByText("철수")).toBeVisible({ timeout: 5000 });

  await hostCtx.close();
  await viewerCtx.close();
});

test("Scenario 2: 존재하지 않는 방코드 입장 시 에러", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/방코드/).fill("999999");
  await page.getByLabel(/닉네임/).nth(1).fill("철수");
  await page.getByRole("button", { name: /입장/ }).click();
  await expect(page.getByText(/방을 찾을 수 없음/)).toBeVisible();
});

test("Scenario 9: viewer 새로고침 후 재입장", async ({ page }) => {
  // host 화면에서 방 생성
  const hostCtx = await page.context().browser()!.newContext();
  const hostPage = await hostCtx.newPage();
  const code = await createRoom(hostPage, "민영");

  // viewer 입장
  await joinRoom(page, code, "철수");
  await expect(page.getByText("철수")).toBeVisible();

  // 새로고침
  await page.reload();
  await page.waitForURL(`/room/${code}`);
  await expect(page.getByText("철수")).toBeVisible({ timeout: 5000 });

  await hostCtx.close();
});

test("Scenario 8: 종료 방 입장 시 에러", async ({ page }) => {
  // 이미 종료된 방코드로 진입
  await page.goto("/?code=000000");
  await page.getByLabel(/닉네임/).nth(1).fill("철수");
  await page.getByRole("button", { name: /입장/ }).click();
  await expect(page.getByText(/방을 찾을 수 없음/)).toBeVisible();
});
