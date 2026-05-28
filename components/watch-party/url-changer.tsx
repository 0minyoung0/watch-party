"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { parseYouTubeUrl } from "@/lib/youtube-url";
import { setVideo } from "@/services/playback";

type Props = {
  roomCode: string;
  onVideoChange: (videoId: string) => void;
};

export function UrlChanger({ roomCode, onVideoChange }: Props) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    setError("");
    const videoId = parseYouTubeUrl(url.trim());
    if (!videoId) {
      setError("유효하지 않은 YouTube URL");
      return;
    }
    setLoading(true);
    try {
      await setVideo(roomCode, videoId);
      onVideoChange(videoId);
      setUrl("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="YouTube URL 입력 후 적용"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
        />
        <Button onClick={handleApply} disabled={!url.trim() || loading}>
          {loading ? "적용 중…" : "적용"}
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
