import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./chat-panel";
import type { Message } from "@/types/message";

vi.mock("@/services/messages", () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

const messages: Message[] = [
  { id: "1", room_code: "483210", member_id: "m1", nickname: "철수", content: "안녕", created_at: "2024-01-01T00:00:01Z" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChatPanel", () => {
  it("메시지 목록 표시", () => {
    render(<ChatPanel messages={messages} roomCode="483210" memberId="m1" nickname="철수" />);
    expect(screen.getAllByText((_, el) => el?.textContent === "철수: 안녕")[0]).toBeInTheDocument();
  });

  it("빈 입력 시 전송 버튼 disabled", () => {
    render(<ChatPanel messages={[]} roomCode="483210" memberId="m1" nickname="철수" />);
    expect(screen.getByRole("button", { name: /전송/ })).toBeDisabled();
  });

  it("입력 후 전송 → sendMessage 호출, 입력란 초기화", async () => {
    const { sendMessage } = await import("@/services/messages");
    const user = userEvent.setup();
    render(<ChatPanel messages={[]} roomCode="483210" memberId="m1" nickname="철수" />);
    const input = screen.getByPlaceholderText(/메시지/);
    await user.type(input, "안녕");
    await user.click(screen.getByRole("button", { name: /전송/ }));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ roomCode: "483210", memberId: "m1", nickname: "철수", content: "안녕" }));
    expect(input).toHaveValue("");
  });
});
