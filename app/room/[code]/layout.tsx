import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Room",
  robots: { index: false, follow: false, nocache: true },
};

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
