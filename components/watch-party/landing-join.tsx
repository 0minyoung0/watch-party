"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { joinRoom } from "@/services/members";
import { saveSession } from "@/hooks/use-session";

type Props = {
  prefillCode?: string;
};

export function LandingJoin({ prefillCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(prefillCode ?? "");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCodeReadonly = !!prefillCode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await joinRoom({ roomCode: code.trim(), nickname: nickname.trim() });
      if (result.error) {
        setError(result.error);
        return;
      }
      saveSession({ roomCode: code.trim(), nickname: result.member.nickname, memberId: result.member.id, isHost: false, joinedAt: result.member.joined_at });
      router.push(`/room/${code.trim()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">방 입장</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="join-code">방코드</FieldLabel>
          <Input
            id="join-code"
            placeholder="6자리 숫자"
            maxLength={6}
            value={code}
            readOnly={isCodeReadonly}
            onChange={(e) => { if (!isCodeReadonly) setCode(e.target.value); }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="join-nickname">닉네임</FieldLabel>
          <Input
            id="join-nickname"
            placeholder="닉네임 (1-20자)"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Button type="submit" disabled={!nickname.trim() || !code.trim() || loading}>
          {loading ? "입장 중…" : "입장"}
        </Button>
      </form>
    </Card>
  );
}
