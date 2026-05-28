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

export function Player({ videoId, isHost, playerRef, onStateChange }: Props) {
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
      <div className="flex flex-col items-center justify-center gap-3 w-full aspect-video bg-muted rounded-lg">
        {isHost ? (
          <>
            <svg className="h-12 w-12 text-muted-foreground opacity-50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
            </svg>
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground font-medium">유튜브 URL을 붙여넣어 시작하세요</p>
              <p className="text-xs text-muted-foreground opacity-70 mt-1">위 입력란에 URL을 붙여넣기 하세요</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground opacity-60 animate-pulse [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground opacity-60 animate-pulse [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground opacity-60 animate-pulse [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-muted-foreground">호스트가 영상을 고르고 있어요</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black" ref={containerRef}>
      <div id="yt-player" className="w-full h-full" />
    </div>
  );
}
