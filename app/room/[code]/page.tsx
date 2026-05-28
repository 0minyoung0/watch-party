"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberList } from "@/components/watch-party/member-list";
import { Player } from "@/components/watch-party/player";
import { UrlChanger } from "@/components/watch-party/url-changer";
import { useMembers } from "@/hooks/use-members";
import { useRoom } from "@/hooks/use-room";
import { usePlaybackSync } from "@/hooks/use-playback-sync";
import { reattach, leaveRoom } from "@/services/members";

type Session = {
  roomCode: string;
  nickname: string;
  memberId: string;
  isHost: boolean;
};

type Props = {
  params: Promise<{ code: string }>;
};

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const room = useRoom(code);
  const members = useMembers(code);
  const playerRef = useRef<YT.Player | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const isHost = session?.isHost ?? false;

  const handleVideoChange = useCallback((id: string) => setVideoId(id), []);

  const { onHostStateChange } = usePlaybackSync({
    roomCode: code,
    isHost,
    playerRef,
    onVideoChange: handleVideoChange,
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/room/${code}`;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = sessionStorage.getItem("watch-party-session");
    if (!raw) {
      router.push(`/?code=${code}`);
      return;
    }

    const s = JSON.parse(raw) as Session;
    if (s.roomCode !== code) {
      router.push(`/?code=${code}`);
      return;
    }

    setSession(s);
    reattach({ memberId: s.memberId, roomCode: code, nickname: s.nickname, isHost: s.isHost });

    return () => {
      if (!s.isHost) leaveRoom(s.memberId);
    };
  }, [code, router]);

  // room이 null(삭제됨)이면 closed 페이지로
  useEffect(() => {
    if (room === null) router.push(`/room/${code}/closed`);
  }, [room, code, router]);

  // room에 video_id 있으면 초기화
  useEffect(() => {
    if (room && room.video_id && !videoId) setVideoId(room.video_id);
  }, [room, videoId]);

  if (room === undefined) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중…</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="w-full max-w-5xl flex flex-col gap-4 mt-4">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-2xl font-mono font-bold tracking-widest">{code}</div>
          <div className="text-sm text-muted-foreground break-all">{shareUrl}</div>
        </div>

        {isHost && (
          <UrlChanger roomCode={code} onVideoChange={handleVideoChange} />
        )}

        <div className="flex gap-4">
          {/* Player area */}
          <div className="flex-1">
            <Player
              roomCode={code}
              videoId={videoId}
              isHost={isHost}
              playerRef={playerRef}
              onStateChange={isHost ? onHostStateChange : undefined}
            />
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
