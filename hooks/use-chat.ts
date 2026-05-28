"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { listMessagesSince } from "@/services/messages";
import type { Message } from "@/types/message";

export function useChat(roomCode: string, joinedAt: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!joinedAt) return;

    listMessagesSince(roomCode, joinedAt).then(setMessages);

    const channel = supabase
      .channel(`messages:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.created_at > joinedAt) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, joinedAt]);

  return messages;
}
