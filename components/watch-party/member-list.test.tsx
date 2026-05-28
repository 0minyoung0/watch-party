import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberList } from "./member-list";
import type { Member } from "@/types/member";

const members: Member[] = [
  { id: "1", room_code: "483210", nickname: "민영", is_host: true, joined_at: "" },
  { id: "2", room_code: "483210", nickname: "철수", is_host: false, joined_at: "" },
];

describe("MemberList", () => {
  it("멤버 닉네임 표시", () => {
    render(<MemberList members={members} />);
    expect(screen.getByText("민영")).toBeInTheDocument();
    expect(screen.getByText("철수")).toBeInTheDocument();
  });

  it("호스트에 HOST 배지 표시", () => {
    render(<MemberList members={members} />);
    expect(screen.getByText("HOST")).toBeInTheDocument();
  });
});
