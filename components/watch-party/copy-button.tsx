"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label?: string;
  className?: string;
};

async function writeToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  // fallback for older WebViews
  const el = document.createElement("input");
  el.value = value;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); } catch { /* ignore */ }
  document.body.removeChild(el);
}

export function CopyButton({ value, label, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await writeToClipboard(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-1.5", className)}
      onClick={handleCopy}
      aria-label={copied ? "복사됨" : "복사"}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label && <span>{copied ? "복사됨" : label}</span>}
      {!label && <span className="sr-only">{copied ? "복사됨" : "복사"}</span>}
    </Button>
  );
}
