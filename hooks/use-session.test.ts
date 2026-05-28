import { describe, it, expect, beforeEach } from "vitest";
import { getSession, saveSession, clearSession } from "./use-session";
import type { WatchPartySession } from "./use-session";

const sample: WatchPartySession = {
  roomCode: "483210",
  nickname: "민영",
  memberId: "uuid-1",
  isHost: true,
  joinedAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => {
  sessionStorage.clear();
});

describe("use-session", () => {
  it("세션 없으면 null 반환", () => {
    expect(getSession()).toBeNull();
  });

  it("saveSession 후 getSession으로 복원", () => {
    saveSession(sample);
    expect(getSession()).toEqual(sample);
  });

  it("clearSession 후 null 반환", () => {
    saveSession(sample);
    clearSession();
    expect(getSession()).toBeNull();
  });
});
