"use client";

import { LandingCreate } from "@/components/watch-party/landing-create";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">Watch Party</h1>
        <LandingCreate />
      </div>
    </main>
  );
}
