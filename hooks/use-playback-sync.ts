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
  // host 위치가 마지막으로 갱신된 wall-clock 시각 — viewer가 시간 흐름을 추정하는 데 사용
  const hostPositionTimestampRef = useRef<number>(Date.now());
  // 구독된 채널 인스턴스를 ref로 보관해 host도 같은 인스턴스로 send
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  function updateHostPosition(positionSeconds: number, isPlaying: boolean) {
    hostPositionRef.current = positionSeconds;
    hostPlayingRef.current = isPlaying;
    hostPositionTimestampRef.current = Date.now();
  }

  useEffect(() => {
    // DB에서 현재 상태 복원
    getState(roomCode).then((state) => {
      if (!state) return;
      updateHostPosition(Number(state.position_seconds), state.is_playing);
      if (state.video_id && onVideoChange) onVideoChange(state.video_id);
    });

    // broadcast 채널 구독 — host와 viewer 모두 subscribe, host는 이 채널로 send
    const ch = supabase
      .channel(`playback:${roomCode}`)
      .on("broadcast", { event: "play" }, ({ payload }) => {
        if (isHost) return;
        updateHostPosition(payload.positionSeconds, true);
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(payload.positionSeconds, true);
        p.playVideo();
      })
      .on("broadcast", { event: "pause" }, ({ payload }) => {
        if (isHost) return;
        updateHostPosition(payload.positionSeconds, false);
        const p = playerRef.current;
        if (!p) return;
        p.seekTo(payload.positionSeconds, true);
        p.pauseVideo();
      })
      .on("broadcast", { event: "seek" }, ({ payload }) => {
        if (isHost) return;
        updateHostPosition(payload.positionSeconds, hostPlayingRef.current);
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
          updateHostPosition(Number(state.position_seconds), state.is_playing);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(dbChannel);
      broadcastChannelRef.current = null;
    };
  }, [roomCode, isHost, playerRef, onVideoChange]);

  // viewer: 2초 주기 드리프트 보정 + play/pause 상태 동기화
  // host 위치는 마지막 알려진 위치 + 경과 시간으로 추정 — play 중일 때만 advance
  useEffect(() => {
    if (isHost) return;

    const YTPlayerState = (window as Window & { YT?: { PlayerState?: { PLAYING?: number; PAUSED?: number } } }).YT?.PlayerState;

    const sync = () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const current = p.getCurrentTime?.();
        if (typeof current !== "number") return;

        const expected = hostPlayingRef.current
          ? hostPositionRef.current + (Date.now() - hostPositionTimestampRef.current) / 1000
          : hostPositionRef.current;

        const playerState = p.getPlayerState?.();
        const isPlayerPlaying = playerState === YTPlayerState?.PLAYING;
        const drift = Math.abs(current - expected);

        if (hostPlayingRef.current && !isPlayerPlaying) {
          // host는 재생 중인데 viewer는 멈춰 있음 — seek 후 재생 (늦게 입장한 경우 포함)
          p.seekTo(expected, true);
          p.playVideo();
        } else if (!hostPlayingRef.current && isPlayerPlaying) {
          // host는 paused인데 viewer는 재생 중 — 정지
          p.pauseVideo();
        } else if (drift > 1) {
          p.seekTo(expected, true);
        }
      } catch {
        // player not ready yet
      }
    };

    sync(); // 즉시 1회 실행 — 입장 직후 host 상태에 빠르게 맞춤
    const interval = setInterval(sync, 2000);

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
      updateHostPosition(pos, true);
      ch.send({ type: "broadcast", event: "play", payload: { positionSeconds: pos, isPlaying: true } });
      supabase.from("playback_state").upsert({ room_code: roomCode, is_playing: true, position_seconds: pos, updated_at: new Date().toISOString() });
    } else if (event.data === YTState?.PAUSED) {
      updateHostPosition(pos, false);
      ch.send({ type: "broadcast", event: "pause", payload: { positionSeconds: pos, isPlaying: false } });
      supabase.from("playback_state").upsert({ room_code: roomCode, is_playing: false, position_seconds: pos, updated_at: new Date().toISOString() });
    }
  }, [isHost, playerRef, roomCode]);

  return { onHostStateChange, hostPositionRef };
}
