"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MemberList } from "@/components/watch-party/member-list";
import { useMembers } from "@/hooks/use-members";
import { getRoom } from "@/services/rooms";
import { joinRoom, leaveRoom, reattach } from "@/services/members";

type Props = {
  params: Promise<{ code: string }>;
};

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const members = useMembers(code);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/room/${code}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = sessionStorage.getItem("watch-party-session");
    if (!raw) {
      router.push(`/?code=${code}&join=1`);
      return;
    }

    const session = JSON.parse(raw) as { roomCode: string; nickname: string; memberId: string; isHost: boolean };
    if (session.roomCode !== code) {
      router.push(`/?code=${code}&join=1`);
      return;
    }

    // verify room exists
    getRoom(code).then((room) => {
      if (!room) router.push(`/room/${code}/closed`);
    });

    // reattach member
    reattach({ memberId: session.memberId, roomCode: code, nickname: session.nickname, isHost: session.isHost });

    // cleanup on unmount (tab close / navigate away)
    return () => {
      if (!session.isHost) {
        leaveRoom(session.memberId);
      }
    };
  }, [code, router]);

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="w-full max-w-5xl flex flex-col gap-4 mt-4">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-2xl font-mono font-bold tracking-widest">{code}</div>
          <div className="text-sm text-muted-foreground break-all">{shareUrl}</div>
        </div>

        <div className="flex gap-4">
          {/* Player area */}
          <div className="flex-1 flex items-center justify-center aspect-video bg-muted rounded-lg">
            <p className="text-muted-foreground">URL을 입력하세요</p>
          </div>

          {/* Sidebar */}
          <div className="w-56 flex flex-col gap-4">
            <MemberList members={members} />
          </div>
        </div>
      </div>
    </main>
  );
}
