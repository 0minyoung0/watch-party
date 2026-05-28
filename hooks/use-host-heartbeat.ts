"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useHostHeartbeat(roomCode: string, isHost: boolean) {
  useEffect(() => {
    if (!isHost) return;

    async function beat() {
      await supabase
        .from("rooms")
        .update({ last_host_seen_at: new Date().toISOString() })
        .eq("code", roomCode);
    }

    beat();
    const interval = setInterval(beat, 5000);
    return () => clearInterval(interval);
  }, [roomCode, isHost]);
}
