"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getRoom } from "@/services/rooms";
import type { Room } from "@/types/room";

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    getRoom(code).then(setRoom);

    const channel = supabase
      .channel(`room:${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRoom(null);
          } else {
            setRoom(payload.new as Room);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [code]);

  return room;
}
