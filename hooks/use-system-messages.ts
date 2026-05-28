"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export type SystemMessage = {
  kind: "join" | "leave";
  nickname: string;
  ts: number;
};

const MAX_SYSTEM_MESSAGES = 20;

export function useSystemMessages(roomCode: string) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`room-system:${roomCode}`)
      .on("broadcast", { event: "system" }, ({ payload }) => {
        const msg = payload as SystemMessage;
        setMessages((prev) => [...prev.slice(-(MAX_SYSTEM_MESSAGES - 1)), msg]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

  const broadcast = useCallback((msg: SystemMessage) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "system",
      payload: msg,
    });
  }, []);

  return { messages, broadcast };
}
