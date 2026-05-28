"use client";

import { useEffect, useRef, MutableRefObject } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type Props = {
  roomCode: string;
  videoId: string | null;
  isHost: boolean;
  playerRef: MutableRefObject<YT.Player | null>;
  onStateChange?: (event: YT.OnStateChangeEvent) => void;
};

function loadYTApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.getElementById("yt-api-script");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "yt-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = resolve;
  });
}

export function Player({ videoId, playerRef, onStateChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoId) return;
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !containerRef.current) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        playerRef.current.stopVideo();
        return;
      }

      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onStateChange: onStateChange ?? (() => {}),
        },
      });
    });

    return () => {
      destroyed = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
        playerRef.current = null;
      }
    };
  }, [videoId, playerRef, onStateChange]);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center w-full aspect-video bg-muted rounded-lg">
        <p className="text-muted-foreground">URL을 입력하세요</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black" ref={containerRef}>
      <div id="yt-player" className="w-full h-full" />
    </div>
  );
}
