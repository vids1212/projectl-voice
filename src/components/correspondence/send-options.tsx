"use client";

import { useState } from "react";
import { Copy, Mail, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SendOptionsProps {
  to: string;
  subject: string;
  body: string;
}

export default function SendOptions({ to, subject, body }: SendOptionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleMailto() {
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
  }

  function handleDownload() {
    const blob = new Blob(
      [`To: ${to}\nSubject: ${subject}\n\n${body}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grievance-email-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">How to send</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex h-auto flex-col gap-1 py-4 border-slate-600 text-slate-300 hover:bg-white/5"
        >
          {copied ? (
            <Check className="h-5 w-5 text-emerald-400" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
          <span className="text-xs">
            {copied ? "Copied!" : "Copy to clipboard"}
          </span>
        </Button>
        <Button
          variant="outline"
          onClick={handleMailto}
          className="flex h-auto flex-col gap-1 py-4 border-slate-600 text-slate-300 hover:bg-white/5"
        >
          <Mail className="h-5 w-5" />
          <span className="text-xs">Open in email app</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex h-auto flex-col gap-1 py-4 border-slate-600 text-slate-300 hover:bg-white/5"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Download as text</span>
        </Button>
      </div>
    </div>
  );
}
