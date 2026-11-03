"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AppLookup({ examples }: { examples: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const go = (app: string) => router.push(`/generate?app=${encodeURIComponent(app)}`);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim().length >= 2) go(value.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="app" className="sr-only">App name or website</label>
        <input
          id="app"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={120}
          placeholder="App name or website, like Xero or pipedrive.com"
          className="min-w-0 flex-1 rounded-md border border-line bg-panel px-4 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
        />
        <button type="submit" className="rounded-md bg-ink px-5 py-3 font-medium text-bg hover:opacity-90">
          Get the guide
        </button>
      </form>
      <p className="mt-2 text-sm text-muted">
        Not in the library? An agent investigates it live, in two to three minutes.
        {examples.length > 0 && " Try "}
        {examples.map((ex, i) => (
          <span key={ex}>
            {i > 0 && ", "}
            <button type="button" onClick={() => go(ex)} className="underline hover:text-ink">{ex}</button>
          </span>
        ))}
        {examples.length > 0 && "."}
      </p>
    </div>
  );
}
