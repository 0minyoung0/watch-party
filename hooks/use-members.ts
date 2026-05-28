"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { listMembers } from "@/services/members";
import type { Member } from "@/types/member";

export function useMembers(roomCode: string) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    // revision counter: 동시 다발 fetch 중 오래된 응답이 최신 state를 덮어쓰지 못하게
    let revision = 0;
    const fetch = async () => {
      const rev = ++revision;
      const data = await listMembers(roomCode);
      if (rev === revision) setMembers(data);
    };

    const channel = supabase
      .channel(`members:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `room_code=eq.${roomCode}` },
        () => fetch()
      )
      // SUBSCRIBED 상태 이후에 초기 fetch: 구독 전 INSERT를 놓치지 않음
      .subscribe((status) => {
        if (status === "SUBSCRIBED") fetch();
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  return members;
}
