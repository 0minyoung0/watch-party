import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "./avatar";
import type { Member } from "@/types/member";

type Props = {
  members: Member[];
  variant?: "stack" | "row";
};

export function MemberList({ members, variant = "stack" }: Props) {
  if (variant === "row") {
    return (
      <div className="flex flex-row items-center gap-2 overflow-x-auto py-1 px-0.5">
        {members.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative">
              <Avatar nickname={m.nickname} size="sm" />
              {m.is_host && (
                <span className="absolute -bottom-1 -right-1 text-[8px] bg-primary text-primary-foreground rounded px-0.5 leading-tight">
                  H
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">{m.nickname}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">참여자 ({members.length}/30)</h3>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <Avatar nickname={m.nickname} size="sm" />
            <span className="truncate">{m.nickname}</span>
            {m.is_host && <Badge variant="secondary" className="ml-auto shrink-0">HOST</Badge>}
          </div>
        ))}
      </div>
    </Card>
  );
}
