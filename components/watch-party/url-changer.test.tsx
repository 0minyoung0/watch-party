import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlChanger } from "./url-changer";

vi.mock("@/services/playback", () => ({
  setVideo: vi.fn().mockResolvedValue(undefined),
}));

describe("UrlChanger", () => {
  it("잘못된 URL → 에러 표시, setVideo 미호출", async () => {
    const { setVideo } = await import("@/services/playback");
    const user = userEvent.setup();
    render(<UrlChanger roomCode="483210" onVideoChange={vi.fn()} />);
    await user.type(screen.getByRole("textbox"), "https://example.com/bad");
    await user.click(screen.getByRole("button", { name: /적용/ }));
    await waitFor(() => expect(screen.getByText(/유효하지 않은 YouTube URL/)).toBeInTheDocument());
    expect(setVideo).not.toHaveBeenCalled();
  });

  it("유효한 URL → setVideo 호출", async () => {
    const { setVideo } = await import("@/services/playback");
    vi.mocked(setVideo).mockResolvedValue(undefined);
    const onVideoChange = vi.fn();
    const user = userEvent.setup();
    render(<UrlChanger roomCode="483210" onVideoChange={onVideoChange} />);
    await user.type(screen.getByRole("textbox"), "https://youtu.be/NEWID123");
    await user.click(screen.getByRole("button", { name: /적용/ }));
    await waitFor(() => expect(setVideo).toHaveBeenCalledWith("483210", "NEWID123"));
    expect(onVideoChange).toHaveBeenCalledWith("NEWID123");
  });
});
