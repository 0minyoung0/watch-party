const WATCH_URL = /^https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&.*)?$/;
const SHORT_URL = /^https:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})(\?.*)?$/;

export function parseYouTubeUrl(url: string): string | null {
  const watchMatch = url.match(WATCH_URL);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(SHORT_URL);
  if (shortMatch) return shortMatch[1];
  return null;
}
