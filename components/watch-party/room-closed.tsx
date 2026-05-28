import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RoomClosed() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="p-8 flex flex-col items-center gap-4 text-center max-w-sm">
        <h1 className="text-xl font-semibold">방이 종료되었습니다</h1>
        <p className="text-sm text-muted-foreground">
          호스트가 30초 이상 응답하지 않아 방이 자동으로 종료되었습니다.
        </p>
        <Button asChild>
          <Link href="/">랜딩으로 돌아가기</Link>
        </Button>
      </Card>
    </div>
  );
}
