"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberList } from "@/components/watch-party/member-list";
import { Player } from "@/components/watch-party/player";
import { UrlChanger } from "@/components/watch-party/url-changer";
import { ChatPanel } from "@/components/watch-party/chat-panel";
import { HostDisconnectedBanner } from "@/components/watch-party/host-disconnected-banner";
import { useMembers } from "@/hooks/use-members";
import { useRoom } from "@/hooks/use-room";
import { usePlaybackSync } from "@/hooks/use-playback-sync";
import { useChat } from "@/hooks/use-chat";
import { useHostHeartbeat } from "@/hooks/use-host-heartbeat";
import { reattach, leaveRoom } from "@/services/members";
import { getSession } from "@/hooks/use-session";

type Session = {
  roomCode: string;
  nickname: string;
  memberId: string;
  isHost: boolean;
  joinedAt: string;
};

type Props = {
  params: Promise<{ code: string }>;
};

const HEARTBEAT_TIMEOUT_MS = 10_000; // 10초 이상 heartbeat 없으면 배너 표시

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const router = useRouter();
  const room = useRoom(code);
  const members = useMembers(code);
  const playerRef = useRef<YT.Player | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const lastHostSeenRef = useRef<number>(Date.now());

  const isHost = session?.isHost ?? false;

  const handleVideoChange = useCallback((id: string) => setVideoId(id), []);

  const { onHostStateChange } = usePlaybackSync({
    roomCode: code,
    isHost,
    playerRef,
    onVideoChange: handleVideoChange,
  });

  const messages = useChat(code, session?.joinedAt ?? "");

  useHostHeartbeat(code, isHost);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/room/${code}`;

  // room.last_host_seen_at 변화 감지로 배너 표시 여부 결정
  useEffect(() => {
    if (!room || isHost) return;
    lastHostSeenRef.current = new Date(room.last_host_seen_at).getTime();
  }, [room, isHost]);

  // viewer: 10초 주기로 last_host_seen_at 확인
  useEffect(() => {
    if (isHost) return;
    const interval = setInterval(() => {
      const age = Date.now() - lastHostSeenRef.current;
      setHostDisconnected(age > HEARTBEAT_TIMEOUT_MS);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHost]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const s = getSession();
    if (!s) {
      router.push(`/?code=${code}`);
      return;
    }

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

  // room 삭제 감지 → closed 페이지
  useEffect(() => {
    if (room === null) router.push(`/room/${code}/closed`);
  }, [room, code, router]);

  // room.video_id 초기화
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

        <HostDisconnectedBanner show={hostDisconnected && !isHost} />

        {isHost && (
          <UrlChanger roomCode={code} onVideoChange={handleVideoChange} />
        )}

        <div className="flex gap-4">
          {/* Player area */}
          <div className="flex-1 flex flex-col gap-4">
            <Player
              roomCode={code}
              videoId={videoId}
              isHost={isHost}
              playerRef={playerRef}
              onStateChange={isHost ? onHostStateChange : undefined}
            />
            {session && (
              <ChatPanel
                messages={messages}
                roomCode={code}
                memberId={session.memberId}
                nickname={session.nickname}
              />
            )}
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
