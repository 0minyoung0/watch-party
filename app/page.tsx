"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LandingCreate } from "@/components/watch-party/landing-create";
import { LandingJoin } from "@/components/watch-party/landing-join";

function LandingContent() {
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get("code") ?? undefined;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">Watch Party</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LandingCreate />
          <LandingJoin prefillCode={prefillCode} />
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
