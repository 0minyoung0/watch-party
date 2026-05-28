import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Player } from "./player";

describe("Player", () => {
  it("videoId 없으면 URL 안내 표시", () => {
    render(<Player roomCode="483210" videoId={null} isHost={true} playerRef={{ current: null }} />);
    expect(screen.getByText(/URL을 입력하세요/)).toBeInTheDocument();
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
