"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberList } from "@/components/watch-party/member-list";
import { Player } from "@/components/watch-party/player";
import { UrlChanger } from "@/components/watch-party/url-changer";
import { ChatPanel } from "@/components/watch-party/chat-panel";
import { HostDisconnectedBanner } from "@/components/watch-party/host-disconnected-banner";
import { CopyButton } from "@/components/watch-party/copy-button";
import { useMembers } from "@/hooks/use-members";
import { useRoom } from "@/hooks/use-room";
import { usePlaybackSync } from "@/hooks/use-playback-sync";
import { useChat } from "@/hooks/use-chat";
import { useHostHeartbeat } from "@/hooks/use-host-heartbeat";
import { useSystemMessages } from "@/hooks/use-system-messages";
import { reattach, leaveRoom } from "@/services/members";
import { getSession, saveSession } from "@/hooks/use-session";

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
  const { messages: systemMessages, broadcast: broadcastSystem } = useSystemMessages(code);

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

    // reattach 결과의 id가 달라지면(fresh insert) session 갱신
    let memberId = s.memberId;
    reattach({ memberId: s.memberId, roomCode: code, nickname: s.nickname, isHost: s.isHost })
      .then((member) => {
        if (member && member.id !== s.memberId) {
          memberId = member.id;
          saveSession({ ...s, memberId: member.id });
          setSession((prev) => (prev ? { ...prev, memberId: member.id } : prev));
        }
        // join broadcast (호스트 재입장 포함)
        broadcastSystem({ kind: "join", nickname: s.nickname, ts: Date.now() });
      });

    // left 가드: pagehide(탭 닫기·새로고침)와 cleanup(SPA 네비게이션) 중 먼저 실행된 쪽만 delete
    let left = false;
    const leave = () => {
      if (left) return;
      left = true;
      broadcastSystem({ kind: "leave", nickname: s.nickname, ts: Date.now() });
      leaveRoom(memberId);
    };

    // pagehide: 탭 닫기·새로고침처럼 실제 언로드 시 호스트 포함 모두 leave
    window.addEventListener("pagehide", leave);

    return () => {
      window.removeEventListener("pagehide", leave);
      // SPA 네비게이션(Next.js router) 시 cleanup에서 leave
      leave();
    };
  }, [code, router, broadcastSystem]);

  // room 삭제 감지 → closed 페이지
  useEffect(() => {
    if (room === null) router.push(`/room/${code}/closed`);
  }, [room, code, router]);

  // room.video_id 초기화
  useEffect(() => {
    if (room && room.video_id && !videoId) setVideoId(room.video_id);
  }, [room, videoId]);

  if (room === undefined) {
    return (
      <main className="min-h-screen flex flex-col items-center p-3 sm:p-4 bg-background">
        <div className="w-full max-w-5xl flex flex-col gap-3 mt-4">
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          <div className="w-full aspect-video bg-muted animate-pulse rounded-lg" />
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-3 sm:p-4 bg-background">
      <div className="w-full max-w-5xl flex flex-col gap-3 mt-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl font-mono font-bold tracking-widest">{code}</span>
            <CopyButton value={code} label="코드 복사" />
          </div>
          <CopyButton value={shareUrl} label="링크 복사" className="w-full sm:w-auto" />
        </div>

        <HostDisconnectedBanner show={hostDisconnected && !isHost} />

        {isHost && (
          <UrlChanger roomCode={code} onVideoChange={handleVideoChange} />
        )}

        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Player area */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <Player
              roomCode={code}
              videoId={videoId}
              isHost={isHost}
              playerRef={playerRef}
              onStateChange={isHost ? onHostStateChange : undefined}
            />
            {/* 모바일: 멤버 가로 스크롤 스트립 */}
            <div className="md:hidden">
              <MemberList members={members} variant="row" />
            </div>
            {session && (
              <ChatPanel
                messages={messages}
                systemMessages={systemMessages}
                roomCode={code}
                memberId={session.memberId}
                nickname={session.nickname}
              />
            )}
          </div>

          {/* Sidebar (데스크톱 전용) */}
          <div className="hidden md:flex w-56 flex-col gap-4">
            <MemberList members={members} />
          </div>
        </div>
      </div>
    </main>
  );
}
