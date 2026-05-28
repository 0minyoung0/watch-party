"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { sendMessage } from "@/services/messages";
import type { Message } from "@/types/message";

type Props = {
  messages: Message[];
  roomCode: string;
  memberId: string;
  nickname: string;
};

export function ChatPanel({ messages, roomCode, memberId, nickname }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setText("");
    setLoading(true);
    try {
      await sendMessage({ roomCode, memberId, nickname, content });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.nickname}</span>: {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input
          placeholder="메시지 입력…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); handleSend(); } }}
        />
        <Button onClick={handleSend} disabled={!text.trim() || loading}>
          전송
        </Button>
      </div>
    </Card>
  );
}
