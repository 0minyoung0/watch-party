import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSystemMessages } from "./use-system-messages";

vi.mock("@/lib/supabase/client", () => {
  const on = vi.fn().mockReturnThis();
  const subscribe = vi.fn().mockReturnThis();
  const channel = vi.fn().mockReturnValue({ on, subscribe, send: vi.fn() });
  return { supabase: { channel, removeChannel: vi.fn() } };
});

describe("useSystemMessages", () => {
  it("초기 messages는 빈 배열", () => {
    const { result } = renderHook(() => useSystemMessages("TEST01"));
    expect(result.current.messages).toEqual([]);
  });

  it("broadcast 함수 존재", () => {
    const { result } = renderHook(() => useSystemMessages("TEST01"));
    expect(typeof result.current.broadcast).toBe("function");
  });
});
