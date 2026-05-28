import { supabase } from "@/lib/supabase/client";
import type { Message } from "@/types/message";

export async function sendMessage({
  roomCode,
  memberId,
  nickname,
  content,
}: {
  roomCode: string;
  memberId: string;
  nickname: string;
  content: string;
}): Promise<void> {
  await supabase.from("messages").insert({ room_code: roomCode, member_id: memberId, nickname, content });
}

export async function listMessagesSince(roomCode: string, since: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select()
    .eq("room_code", roomCode)
    .gt("created_at", since)
    .order("created_at", { ascending: true });
  return data ?? [];
}
