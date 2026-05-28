"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { sendMessage } from "@/services/messages";
import { Avatar } from "./avatar";
import type { Message } from "@/types/message";
import type { SystemMessage } from "@/hooks/use-system-messages";

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
});

type ChatItem =
  | { kind: "message"; data: Message }
  | { kind: "system"; data: SystemMessage };

type Props = {
  messages: Message[];
  systemMessages?: SystemMessage[];
  roomCode: string;
  memberId: string;
  nickname: string;
};

export function ChatPanel({ messages, systemMessages = [], roomCode, memberId, nickname }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, systemMessages]);

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

  // 채팅 메시지와 시스템 메시지를 시간순으로 머지
  const items: ChatItem[] = [
    ...messages.map((m): ChatItem => ({ kind: "message", data: m })),
    ...systemMessages.map((m): ChatItem => ({ kind: "system", data: m })),
  ].sort((a, b) => {
    const ta = a.kind === "message" ? new Date(a.data.created_at).getTime() : a.data.ts;
    const tb = b.kind === "message" ? new Date(b.data.created_at).getTime() : b.data.ts;
    return ta - tb;
  });

  return (
    <Card className="flex flex-col h-80 md:h-[28rem] md:flex-1 md:min-h-0">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {items.map((item, idx) => {
          if (item.kind === "system") {
            return (
              <div key={`sys-${item.data.ts}`} className="text-xs text-muted-foreground text-center italic py-0.5">
                {item.data.kind === "join" ? `${item.data.nickname}님이 입장했어요` : `${item.data.nickname}님이 나갔어요`}
              </div>
            );
          }

          const m = item.data;
          const prev = idx > 0 ? items[idx - 1] : null;
          const prevMsg = prev?.kind === "message" ? prev.data : null;
          const isGrouped =
            prevMsg?.member_id === m.member_id &&
            new Date(m.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60_000;

          return (
            <div key={m.id} className={`flex gap-2 items-start ${isGrouped ? "ml-8" : ""}`}>
              {!isGrouped && <Avatar nickname={m.nickname} size="sm" />}
              <div className="flex flex-col min-w-0">
                {!isGrouped && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold truncate">{m.nickname}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {timeFormatter.format(new Date(m.created_at))}
                    </span>
                  </div>
                )}
                <p className="text-sm break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
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
