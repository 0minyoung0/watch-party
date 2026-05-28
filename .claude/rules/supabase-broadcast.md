# Supabase Broadcast: subscribed 채널 인스턴스로만 send

## 규칙

Supabase Realtime broadcast를 사용할 때, `.send()`는 반드시 `.subscribe()`가 완료된 **같은 채널 인스턴스**를 통해 호출해야 한다.

```ts
// ❌ 잘못된 패턴 — 새 채널 인스턴스로 send: silent fail
await supabase.channel(`room:${id}`).send({ type: "broadcast", event: "play", payload });

// ✅ 올바른 패턴 — 구독된 채널 ref를 통해 send
const ch = supabase.channel(`room:${id}`).on(...).subscribe();
channelRef.current = ch;
// ... 나중에:
channelRef.current?.send({ type: "broadcast", event: "play", payload });
```

**Why:** Supabase JS v2에서 subscribe되지 않은 채널로 `.send()`를 호출하면 전송이 이루어지지 않고 에러도 발생하지 않는다(silent fail). 수신 측이 다른 채널 인스턴스를 구독하고 있으면 broadcast가 도달하지 않는다.

**How to apply:** hook 내부에서 `useRef`로 구독된 채널 인스턴스를 보관하고, send가 필요한 시점에 ref를 통해 호출한다. `broadcastControl` 같은 별도 service 함수에서 채널을 새로 생성해 send하는 패턴은 피한다.
