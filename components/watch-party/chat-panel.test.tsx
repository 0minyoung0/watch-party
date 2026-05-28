import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./chat-panel";
import type { Message } from "@/types/message";
import type { SystemMessage } from "@/hooks/use-system-messages";

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
  it("메시지 목록 표시 (닉네임과 내용 분리 렌더)", () => {
    render(<ChatPanel messages={messages} roomCode="483210" memberId="m1" nickname="철수" />);
    expect(screen.getByText("철수")).toBeInTheDocument();
    expect(screen.getByText("안녕")).toBeInTheDocument();
  });

  it("타임스탬프 표시 (시:분 형식)", () => {
    render(<ChatPanel messages={messages} roomCode="483210" memberId="m1" nickname="철수" />);
    // 시간 포맷 확인 (오전/오후 포함 한국 포맷이므로 ':' 포함 여부로 확인)
    const timeEl = screen.getByText(/:/);
    expect(timeEl).toBeInTheDocument();
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

  it("IME composition 중 Enter는 전송하지 않음 (Mac 한글 버그 방지)", async () => {
    const { sendMessage } = await import("@/services/messages");
    const user = userEvent.setup();
    render(<ChatPanel messages={[]} roomCode="483210" memberId="m1" nickname="철수" />);
    const input = screen.getByPlaceholderText(/메시지/);
    await user.type(input, "안녕");
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229, isComposing: true });
    expect(sendMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue("안녕");
  });

  it("composition 완료 후 Enter는 정상 전송", async () => {
    const { sendMessage } = await import("@/services/messages");
    const user = userEvent.setup();
    render(<ChatPanel messages={[]} roomCode="483210" memberId="m1" nickname="철수" />);
    const input = screen.getByPlaceholderText(/메시지/);
    await user.type(input, "안녕");
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13, isComposing: false });
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ roomCode: "483210", memberId: "m1", nickname: "철수", content: "안녕" }));
  });

  it("시스템 메시지 join 렌더", () => {
    const systemMessages: SystemMessage[] = [
      { kind: "join", nickname: "민영", ts: Date.now() },
    ];
    render(<ChatPanel messages={[]} systemMessages={systemMessages} roomCode="483210" memberId="m1" nickname="철수" />);
    expect(screen.getByText("민영님이 입장했어요")).toBeInTheDocument();
  });

  it("시스템 메시지 leave 렌더", () => {
    const systemMessages: SystemMessage[] = [
      { kind: "leave", nickname: "민영", ts: Date.now() },
    ];
    render(<ChatPanel messages={[]} systemMessages={systemMessages} roomCode="483210" memberId="m1" nickname="철수" />);
    expect(screen.getByText("민영님이 나갔어요")).toBeInTheDocument();
  });
});
