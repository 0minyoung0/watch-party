"use client";

import { useEffect, useRef, MutableRefObject } from "react";
import { supabase } from "@/lib/supabase/client";
import { getState, broadcastControl } from "@/services/playback";
import type { PlaybackState } from "@/types/playback";

type Options = {
  roomCode: string;
  isHost: boolean;
  playerRef: MutableRefObject<YT.Player | null>;
  onVideoChange?: (videoId: string) => void;
};

export function usePlaybackSync({ roomCode, isHost, playerRef, onVideoChange }: Options) {
  const hostPositionRef = useRef<number>(0);
  const hostPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    // DB에서 현재 상태 복원
    getState(roomCode).then((state) => {
      if (!state) return;
      hostPositionRef.current = Number(state.position_seconds);
      hostPlayingRef.current = state.is_playing;
      if (state.video_id && onVideoChange) onVideoChange(state.video_id);
    });

    // broadcast 채널 구독 (viewer: host 제어 수신)
    const broadcastChannel = supabase
      .channel(`playback:${roomCode}`)
      .on("broadcast", { event: "play" }, ({ payload }) => {
        if (isHost) return;
        hostPositionRef.current = payload.positionSeconds;
        hostPlayingRef.current = true;
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(payload.positionSeconds, true);
        p.playVideo();
      })
      .on("broadcast", { event: "pause" }, ({ payload }) => {
        if (isHost) return;
        hostPositionRef.current = payload.positionSeconds;
        hostPlayingRef.current = false;
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(payload.positionSeconds, true);
        p.pauseVideo();
      })
      .on("broadcast", { event: "seek" }, ({ payload }) => {
        if (isHost) return;
        hostPositionRef.current = payload.positionSeconds;
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(payload.positionSeconds, true);
      })
      .subscribe();

    // postgres_changes: video_id 변경 감지 (viewer에게 새 영상 전달)
    const dbChannel = supabase
      .channel(`playback-db:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "playback_state", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const state = payload.new as PlaybackState;
          if (state.video_id && onVideoChange) onVideoChange(state.video_id);
          hostPositionRef.current = Number(state.position_seconds);
          hostPlayingRef.current = state.is_playing;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [roomCode, isHost, playerRef, onVideoChange]);

  // viewer: 2초 주기 드리프트 보정
  useEffect(() => {
    if (isHost) return;

    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p || !hostPlayingRef.current) return;
      try {
        const current = p.getCurrentTime?.();
        if (typeof current !== "number") return;
        const drift = Math.abs(current - hostPositionRef.current);
        if (drift > 1) {
          p.seekTo(hostPositionRef.current, true);
        }
      } catch {
        // player not ready yet
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, playerRef]);

  // host: player 상태 변화 → broadcast + DB write-through
  function onHostStateChange(event: YT.OnStateChangeEvent) {
    if (!isHost) return;
    const p = playerRef.current;
    if (!p) return;

    const pos = p.getCurrentTime?.() ?? 0;

    if (event.data === window.YT?.PlayerState?.PLAYING) {
      hostPositionRef.current = pos;
      hostPlayingRef.current = true;
      broadcastControl(roomCode, "play", pos, true);
    } else if (event.data === window.YT?.PlayerState?.PAUSED) {
      hostPositionRef.current = pos;
      hostPlayingRef.current = false;
      broadcastControl(roomCode, "pause", pos, false);
    }
  }

  return { onHostStateChange, hostPositionRef };
}
