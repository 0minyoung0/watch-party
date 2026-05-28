"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { listMembers } from "@/services/members";
import type { Member } from "@/types/member";

export function useMembers(roomCode: string) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    listMembers(roomCode).then(setMembers);

    const channel = supabase
      .channel(`members:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `room_code=eq.${roomCode}` },
        () => listMembers(roomCode).then(setMembers)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  return members;
}
