import { describe, it, expect } from "vitest";
import { generateRoomCode } from "./room-code";

describe("generateRoomCode", () => {
  it("6자리 문자열 반환", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it("숫자 문자열 (0-leading 포함)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("0-leading 코드 생성 가능 (000000 ~ 099999 범위)", () => {
    // 통계적 검증: 100회 중 최소 1회는 0~9 시작 확률이 높음
    const codes = Array.from({ length: 200 }, generateRoomCode);
    const hasLeadingZero = codes.some((c) => c.startsWith("0"));
    // 통계적으로 200회 중 최소 1회는 0으로 시작해야 함 (P ≈ 1 - 0.9^200 ≈ 100%)
    expect(hasLeadingZero).toBe(true);
  });
});
