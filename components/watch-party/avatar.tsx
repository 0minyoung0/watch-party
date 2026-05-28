type Props = {
  nickname: string;
  size?: "sm" | "md";
};

function hashNickname(nickname: string): number {
  return Array.from(nickname).reduce((a, c) => a + (c.codePointAt(0) ?? 0), 0);
}

export function Avatar({ nickname, size = "md" }: Props) {
  const hash = hashNickname(nickname);
  const bg = `hsl(${hash % 360} 65% 55%)`;
  const initial = Array.from(nickname.trim())[0] ?? "?";

  const sizeClass = size === "sm"
    ? "h-6 w-6 text-xs"
    : "h-8 w-8 text-sm";

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium text-white shrink-0 select-none`}
      style={{ backgroundColor: bg }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
