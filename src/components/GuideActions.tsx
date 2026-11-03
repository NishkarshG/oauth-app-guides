"use client";

import { useState } from "react";

export function GuideActions({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  };
  const button = "rounded-md border border-line bg-panel px-3 py-1.5 text-sm hover:border-ink";
  return (
    <div className="no-print flex flex-wrap gap-2">
      <button className={button} onClick={() => copy("link", window.location.href.split("?")[0])}>
        {copied === "link" ? "Copied" : "Copy link"}
      </button>
      <button className={button} onClick={() => copy("markdown", markdown)}>
        {copied === "markdown" ? "Copied" : "Copy as Markdown"}
      </button>
      <button className={button} onClick={() => window.print()}>Print</button>
    </div>
  );
}
