"use client";

import { use } from "react";

type Props = {
  params: Promise<{ code: string }>;
};

export default function RoomPage({ params }: Props) {
  const { code } = use(params);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/room/${code}`;

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="w-full max-w-4xl flex flex-col gap-4 mt-8">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-mono font-bold tracking-widest">{code}</div>
          <div className="text-sm text-muted-foreground break-all">{shareUrl}</div>
        </div>
        <div className="flex items-center justify-center aspect-video bg-muted rounded-lg">
          <p className="text-muted-foreground">URL을 입력하세요</p>
        </div>
      </div>
    </main>
  );
}
