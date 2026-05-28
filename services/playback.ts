import { supabase } from "@/lib/supabase/client";
import type { PlaybackState } from "@/types/playback";

export async function setVideo(roomCode: string, videoId: string): Promise<void> {
  await supabase.from("playback_state").upsert({
    room_code: roomCode,
    video_id: videoId,
    is_playing: false,
    position_seconds: 0,
    updated_at: new Date().toISOString(),
  });
  await supabase.from("rooms").update({ video_id: videoId }).eq("code", roomCode);
}

export async function getState(roomCode: string): Promise<PlaybackState | null> {
  const { data } = await supabase
    .from("playback_state")
    .select()
    .eq("room_code", roomCode)
    .single();
  return data ?? null;
}

export async function broadcastControl(
  roomCode: string,
  event: "play" | "pause" | "seek",
  positionSeconds: number,
  isPlaying: boolean
): Promise<void> {
  await supabase
    .channel(`playback:${roomCode}`)
    .send({
      type: "broadcast",
      event,
      payload: { positionSeconds, isPlaying },
    });

  await supabase.from("playback_state").upsert({
    room_code: roomCode,
    is_playing: isPlaying,
    position_seconds: positionSeconds,
    updated_at: new Date().toISOString(),
  });
}
