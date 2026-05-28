"use client";

const SESSION_KEY = "watch-party-session";

export type WatchPartySession = {
  roomCode: string;
  nickname: string;
  memberId: string;
  isHost: boolean;
  joinedAt: string;
};

export function getSession(): WatchPartySession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WatchPartySession;
  } catch {
    return null;
  }
}

export function saveSession(session: WatchPartySession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
