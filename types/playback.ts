export type PlaybackState = {
  room_code: string;
  video_id: string | null;
  is_playing: boolean;
  position_seconds: number;
  updated_at: string;
};
