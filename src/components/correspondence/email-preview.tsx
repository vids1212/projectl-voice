"use client";

import { motion } from "framer-motion";

interface EmailPreviewProps {
  to: string;
  subject: string;
  body: string;
  highlightedSentences?: Set<string>;
}

function normaliseBody(body: string): string {
  return body
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function renderBody(body: string, highlighted?: Set<string>) {
  const normalised = normaliseBody(body);

  if (!highlighted || highlighted.size === 0) {
    return <span>{normalised}</span>;
  }

  const parts = normalised.split(/(?<=[.!?\n])\s*/);
  return (
    <>
      {parts.map((part, i) => {
        const trimmed = part.trim();
        const isHighlighted = Array.from(highlighted).some(
          (h) => trimmed.includes(h) || h.includes(trimmed)
        );
        return isHighlighted ? (
          <mark
            key={i}
            className="rounded bg-amber-100 px-0.5 text-slate-800 transition-colors duration-500"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

export default function EmailPreview({ to, subject, body, highlightedSentences }: EmailPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-700/50 bg-slate-900/60 shadow-sm"
    >
      <div className="border-b border-slate-700/50 px-6 py-4">
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium text-slate-500">To:</span>{" "}
            <span className="text-slate-300">{to}</span>
          </p>
          <p>
            <span className="font-medium text-slate-500">Subject:</span>{" "}
            <span className="text-slate-300">{subject}</span>
          </p>
        </div>
      </div>
      <div className="px-6 py-5">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
          {renderBody(body, highlightedSentences)}
        </pre>
      </div>
    </motion.div>
  );
}
