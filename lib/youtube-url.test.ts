import { describe, it, expect } from "vitest";
import { parseYouTubeUrl } from "./youtube-url";

describe("parseYouTubeUrl", () => {
  it("watch?v= 형식 파싱", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("youtu.be/ 형식 파싱", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("watch?v= + 추가 파라미터 허용", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe("dQw4w9WgXcQ");
  });

  it("잘못된 URL → null", () => {
    expect(parseYouTubeUrl("https://example.com/x")).toBeNull();
  });

  it("embed URL → null (spec 불변 규칙)", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBeNull();
  });

  it("shorts URL → null (spec 불변 규칙)", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBeNull();
  });

  it("빈 문자열 → null", () => {
    expect(parseYouTubeUrl("")).toBeNull();
  });
});
