export type Room = {
  code: string;
  host_member_id: string | null;
  video_id: string | null;
  last_host_seen_at: string;
  created_at: string;
};
