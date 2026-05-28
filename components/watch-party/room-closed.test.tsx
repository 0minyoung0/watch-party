import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomClosed } from "./room-closed";

describe("RoomClosed", () => {
  it("종료 메시지 표시", () => {
    render(<RoomClosed />);
    expect(screen.getByText(/방이 종료되었습니다/)).toBeInTheDocument();
  });

  it("랜딩 링크 표시", () => {
    render(<RoomClosed />);
    expect(screen.getByRole("link", { name: /랜딩으로 돌아가기/ })).toBeInTheDocument();
  });
});
