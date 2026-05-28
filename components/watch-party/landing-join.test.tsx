import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingJoin } from "./landing-join";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/services/members", () => ({
  joinRoom: vi.fn().mockResolvedValue({ member: { id: "uuid-철수", nickname: "철수", is_host: false, room_code: "483210", joined_at: "" } }),
}));

beforeEach(() => mockPush.mockClear());

describe("LandingJoin", () => {
  it("닉네임 비어 있으면 버튼 disabled", () => {
    render(<LandingJoin />);
    expect(screen.getByRole("button", { name: /입장/ })).toBeDisabled();
  });

  it("방코드+닉네임 입력 시 버튼 활성화", async () => {
    const user = userEvent.setup();
    render(<LandingJoin />);
    await user.type(screen.getByLabelText(/방코드/), "483210");
    await user.type(screen.getByLabelText(/닉네임/), "철수");
    expect(screen.getByRole("button", { name: /입장/ })).not.toBeDisabled();
  });

  it("prefillCode prop으로 방코드 pre-fill", () => {
    render(<LandingJoin prefillCode="483210" />);
    expect(screen.getByLabelText(/방코드/)).toHaveValue("483210");
  });

  it("joinRoom 에러 → 에러 메시지 표시", async () => {
    const { joinRoom } = await import("@/services/members");
    vi.mocked(joinRoom).mockResolvedValueOnce({ member: null as never, error: "방을 찾을 수 없음" });
    const user = userEvent.setup();
    render(<LandingJoin />);
    await user.type(screen.getByLabelText(/방코드/), "999999");
    await user.type(screen.getByLabelText(/닉네임/), "철수");
    await user.click(screen.getByRole("button", { name: /입장/ }));
    await waitFor(() => expect(screen.getByText(/방을 찾을 수 없음/)).toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("성공 시 방 화면으로 이동", async () => {
    const user = userEvent.setup();
    render(<LandingJoin />);
    await user.type(screen.getByLabelText(/방코드/), "483210");
    await user.type(screen.getByLabelText(/닉네임/), "철수");
    await user.click(screen.getByRole("button", { name: /입장/ }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/room/483210"));
  });
});
