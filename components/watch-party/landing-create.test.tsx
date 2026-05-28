import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingCreate } from "./landing-create";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/services/rooms", () => ({
  createRoom: vi.fn().mockResolvedValue({
    room: { code: "483210", host_member_id: "uuid-host", video_id: "dQw4w9WgXcQ" },
    host: { id: "uuid-host", nickname: "민영", is_host: true, room_code: "483210", joined_at: "" },
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("LandingCreate", () => {
  it("닉네임이 비어 있으면 버튼 disabled", async () => {
    render(<LandingCreate />);
    const btn = screen.getByRole("button", { name: /방 만들기/ });
    expect(btn).toBeDisabled();
  });

  it("닉네임 입력 시 버튼 활성화", async () => {
    const user = userEvent.setup();
    render(<LandingCreate />);
    await user.type(screen.getByLabelText(/닉네임/), "민영");
    expect(screen.getByRole("button", { name: /방 만들기/ })).not.toBeDisabled();
  });

  it("잘못된 URL 입력 시 에러 표시, 페이지 이동 없음", async () => {
    const user = userEvent.setup();
    render(<LandingCreate />);
    await user.type(screen.getByLabelText(/닉네임/), "민영");
    await user.type(screen.getByLabelText(/YouTube URL/), "https://example.com/x");
    await user.click(screen.getByRole("button", { name: /방 만들기/ }));
    expect(screen.getByText(/유효하지 않은 YouTube URL/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("유효한 입력 시 createRoom 호출 후 방 화면으로 이동", async () => {
    const user = userEvent.setup();
    render(<LandingCreate />);
    await user.type(screen.getByLabelText(/닉네임/), "민영");
    await user.type(screen.getByLabelText(/YouTube URL/), "https://youtu.be/dQw4w9WgXcQ");
    await user.click(screen.getByRole("button", { name: /방 만들기/ }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/room/483210"));
  });
});
