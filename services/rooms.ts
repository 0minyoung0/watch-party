import { supabase } from "@/lib/supabase/client";
import { generateRoomCode } from "@/lib/room-code";
import type { Room } from "@/types/room";
import type { Member } from "@/types/member";

type CreateRoomParams = {
  nickname: string;
  videoId?: string | null;
};

type CreateRoomResult = {
  room: Room;
  host: Member;
};

export async function createRoom({ nickname, videoId }: CreateRoomParams): Promise<CreateRoomResult> {
  const code = generateRoomCode();

  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({ code, video_id: videoId ?? null })
    .select()
    .single();

  if (roomErr) throw roomErr;

  const { data: host, error: memberErr } = await supabase
    .from("members")
    .insert({ room_code: code, nickname, is_host: true })
    .select()
    .single();

  if (memberErr) throw memberErr;

  const { error: updateErr } = await supabase
    .from("rooms")
    .update({ host_member_id: host.id })
    .eq("code", code);

  if (updateErr) throw updateErr;

  return { room: { ...room, host_member_id: host.id }, host };
}

export async function getRoom(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("code", code)
    .single();

  if (error) return null;
  return data;
}
