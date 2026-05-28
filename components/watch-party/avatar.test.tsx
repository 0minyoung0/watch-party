import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it("한글 닉네임 첫 글자 표시", () => {
    const { container } = render(<Avatar nickname="민영" />);
    expect(container.firstChild?.textContent).toBe("민");
  });

  it("영문 닉네임 첫 글자 표시", () => {
    const { container } = render(<Avatar nickname="Alice" />);
    expect(container.firstChild?.textContent).toBe("A");
  });

  it("같은 닉네임 → 같은 배경색 (결정론적)", () => {
    const { container: a } = render(<Avatar nickname="철수" />);
    const { container: b } = render(<Avatar nickname="철수" />);
    const colorA = (a.firstChild as HTMLElement).style.backgroundColor;
    const colorB = (b.firstChild as HTMLElement).style.backgroundColor;
    expect(colorA).toBe(colorB);
  });

  it("다른 닉네임 → 다른 배경색", () => {
    const { container: a } = render(<Avatar nickname="민영" />);
    const { container: b } = render(<Avatar nickname="철수" />);
    const colorA = (a.firstChild as HTMLElement).style.backgroundColor;
    const colorB = (b.firstChild as HTMLElement).style.backgroundColor;
    expect(colorA).not.toBe(colorB);
  });

  it("size=sm에 h-6 w-6 클래스 적용", () => {
    const { container } = render(<Avatar nickname="민영" size="sm" />);
    expect((container.firstChild as HTMLElement).className).toContain("h-6");
    expect((container.firstChild as HTMLElement).className).toContain("w-6");
  });
});
