import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HostDisconnectedBanner } from "./host-disconnected-banner";

describe("HostDisconnectedBanner", () => {
  it("show=false 이면 렌더 안 됨", () => {
    const { container } = render(<HostDisconnectedBanner show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("show=true 이면 배너 표시", () => {
    render(<HostDisconnectedBanner show={true} />);
    expect(screen.getByText(/호스트 연결이 끊겼습니다/)).toBeInTheDocument();
  });
});
