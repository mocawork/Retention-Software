"use client";

import { Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Shows recovery codes once, with copy and download (design.md §3.4: plain words). */
export function RecoveryCodeList({ codes }: { codes: readonly string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const text = [
      "RetentionOS recovery codes",
      "Each code works once. Use one if you can't get a code from your authenticator app.",
      "",
      ...codes,
      "",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "retentionos-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <ul
        aria-label="Recovery codes"
        className="grid grid-cols-2 gap-2 rounded-md border border-border/40 bg-bg p-4 font-mono text-sm sm:grid-cols-3"
      >
        {codes.map((code) => (
          <li key={code} className="tracking-wider">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Copy aria-hidden="true" />
          {copied ? "Copied" : "Copy codes"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download aria-hidden="true" />
          Download as a file
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Recovery codes copied." : ""}
      </p>
    </div>
  );
}
