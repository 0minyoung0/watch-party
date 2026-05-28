"use client";

import { useEffect, useRef, MutableRefObject, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getState } from "@/services/playback";
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
  // 구독된 채널 인스턴스를 ref로 보관해 host도 같은 인스턴스로 send
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // DB에서 현재 상태 복원
    getState(roomCode).then((state) => {
      if (!state) return;
      hostPositionRef.current = Number(state.position_seconds);
      hostPlayingRef.current = state.is_playing;
      if (state.video_id && onVideoChange) onVideoChange(state.video_id);
    });

    // broadcast 채널 구독 — host와 viewer 모두 subscribe, host는 이 채널로 send
    const ch = supabase
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

    broadcastChannelRef.current = ch;

    // postgres_changes: video_id 변경 감지
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
      supabase.removeChannel(ch);
      supabase.removeChannel(dbChannel);
      broadcastChannelRef.current = null;
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

  // host: player 상태 변화 → 구독된 채널을 통해 broadcast + DB write-through
  const onHostStateChange = useCallback((event: YT.OnStateChangeEvent) => {
    if (!isHost) return;
    const p = playerRef.current;
    const ch = broadcastChannelRef.current;
    if (!p || !ch) return;

    const pos = p.getCurrentTime?.() ?? 0;
    const YTState = (window as Window & { YT?: { PlayerState?: { PLAYING?: number; PAUSED?: number } } }).YT?.PlayerState;

    if (event.data === YTState?.PLAYING) {
      hostPositionRef.current = pos;
      hostPlayingRef.current = true;
      ch.send({ type: "broadcast", event: "play", payload: { positionSeconds: pos, isPlaying: true } });
      supabase.from("playback_state").upsert({ room_code: roomCode, is_playing: true, position_seconds: pos, updated_at: new Date().toISOString() });
    } else if (event.data === YTState?.PAUSED) {
      hostPositionRef.current = pos;
      hostPlayingRef.current = false;
      ch.send({ type: "broadcast", event: "pause", payload: { positionSeconds: pos, isPlaying: false } });
      supabase.from("playback_state").upsert({ room_code: roomCode, is_playing: false, position_seconds: pos, updated_at: new Date().toISOString() });
    }
  }, [isHost, playerRef, roomCode]);

  // host seek 이벤트 (현재 시간 기반 주기적 싱크) — 드리프트 보정 대신 seek 이벤트 직접 감지
  // YouTube API는 seek 전용 이벤트를 제공하지 않음. PLAYING 이벤트가 seek 후에도 발생하므로 onHostStateChange로 커버됨

  return { onHostStateChange, hostPositionRef };
}
