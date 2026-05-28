import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/types/member";

type Props = {
  members: Member[];
};

export function MemberList({ members }: Props) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">참여자 ({members.length}/10)</h3>
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span>{m.nickname}</span>
            {m.is_host && <Badge variant="secondary">HOST</Badge>}
          </div>
        ))}
      </div>
    </Card>
  );
}
