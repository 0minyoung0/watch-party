"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { createRoom } from "@/services/rooms";

export function LandingCreate() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError("");

    let videoId: string | null = null;
    if (url.trim()) {
      videoId = parseYouTubeUrl(url.trim());
      if (!videoId) {
        setUrlError("유효하지 않은 YouTube URL");
        return;
      }
    }

    setLoading(true);
    try {
      const { room, host } = await createRoom({ nickname: nickname.trim(), videoId });
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "watch-party-session",
          JSON.stringify({ roomCode: room.code, nickname: host.nickname, memberId: host.id, isHost: true })
        );
      }
      router.push(`/room/${room.code}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">방 만들기</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="create-nickname">닉네임</FieldLabel>
          <Input
            id="create-nickname"
            placeholder="닉네임 (1-20자)"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </Field>
        <Field data-invalid={!!urlError || undefined}>
          <FieldLabel htmlFor="create-url">YouTube URL (선택)</FieldLabel>
          <Input
            id="create-url"
            placeholder="https://youtu.be/..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
          />
          {urlError && <FieldError>{urlError}</FieldError>}
        </Field>
        <Button type="submit" disabled={!nickname.trim() || loading}>
          {loading ? "생성 중…" : "방 만들기"}
        </Button>
      </form>
    </Card>
  );
}
