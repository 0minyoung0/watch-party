import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Player } from "./player";

describe("Player", () => {
  it("videoId 없고 host이면 URL 입력 안내 표시", () => {
    render(<Player roomCode="483210" videoId={null} isHost={true} playerRef={{ current: null }} />);
    expect(screen.getByText(/유튜브 URL을 붙여넣어 시작하세요/)).toBeInTheDocument();
  });

  it("videoId 없고 viewer이면 호스트 대기 메시지 표시", () => {
    render(<Player roomCode="483210" videoId={null} isHost={false} playerRef={{ current: null }} />);
    expect(screen.getByText(/호스트가 영상을 고르고 있어요/)).toBeInTheDocument();
  });

  it("videoId 있으면 player 컨테이너 렌더", () => {
    render(<Player roomCode="483210" videoId="dQw4w9WgXcQ" isHost={true} playerRef={{ current: null }} />);
    expect(document.getElementById("yt-player")).toBeInTheDocument();
  });

  it("viewer 모드에서 URL 입력란 없음 (url-changer는 별도 컴포넌트)", () => {
    render(<Player roomCode="483210" videoId="dQw4w9WgXcQ" isHost={false} playerRef={{ current: null }} />);
    // url-changer는 host만 마운트하므로 Player 자체에 input 없음
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
