import { supabase } from "@/lib/supabase/client";
import type { Member } from "@/types/member";

export async function joinRoom({
  roomCode,
  nickname,
}: {
  roomCode: string;
  nickname: string;
}): Promise<{ member: Member; error?: string }> {
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .select("code")
    .eq("code", roomCode)
    .single();

  if (roomErr || !room) return { member: null as unknown as Member, error: "방을 찾을 수 없음" };

  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("room_code", roomCode);

  if ((count ?? 0) >= 30) return { member: null as unknown as Member, error: "방이 가득 찼습니다" };

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .insert({ room_code: roomCode, nickname, is_host: false })
    .select()
    .single();

  if (memberErr) return { member: null as unknown as Member, error: memberErr.message };
  return { member };
}

export async function leaveRoom(memberId: string): Promise<void> {
  await supabase.from("members").delete().eq("id", memberId);
}

export async function listMembers(roomCode: string): Promise<Member[]> {
  const { data } = await supabase
    .from("members")
    .select()
    .eq("room_code", roomCode)
    .order("joined_at", { ascending: true });
  return data ?? [];
}

export async function reattach({
  memberId,
  roomCode,
  nickname,
  isHost,
}: {
  memberId: string;
  roomCode: string;
  nickname: string;
  isHost: boolean;
}): Promise<Member | null> {
  const { data: existing } = await supabase
    .from("members")
    .select()
    .eq("id", memberId)
    .single();

  if (existing) return existing;

  // 재접속 fresh insert 시 is_host는 항상 false — 권한 탈취 방지
  const { data: member } = await supabase
    .from("members")
    .insert({ room_code: roomCode, nickname, is_host: false })
    .select()
    .single();

  return member ?? null;
}
