import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CopyButton } from "./copy-button";

const writeTextMock = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  });
  writeTextMock.mockClear();
});

describe("CopyButton", () => {
  it("클릭 시 clipboard.writeText 호출", async () => {
    render(<CopyButton value="ABC123" label="코드 복사" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("ABC123"));
  });

  it("클릭 후 aria-label이 '복사됨'으로 변경", async () => {
    render(<CopyButton value="ABC123" label="코드 복사" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "복사됨")
    );
  });

  it("2초 후 aria-label이 '복사'로 복귀", async () => {
    vi.useFakeTimers();
    render(<CopyButton value="ABC123" label="코드 복사" />);
    fireEvent.click(screen.getByRole("button"));
    // 클립보드 Promise 완료 대기
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "복사됨");
    // 2초 진행
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "복사");
    vi.useRealTimers();
  });
});
