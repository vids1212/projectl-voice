"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Send as SendIcon, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import EmailPreview from "@/components/correspondence/email-preview";
import SendOptions from "@/components/correspondence/send-options";
import { useCaseStore } from "@/lib/case-store";
import type { CaseState, EscalationLevel } from "@/types";

function snapshotCaseState(): CaseState {
  const s = useCaseStore.getState();
  return {
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    currentLevel: s.currentLevel,
    userNarrative: s.userNarrative,
    extractedData: s.extractedData,
    company: s.company,
    correspondence: s.correspondence,
    emailRefinementHistory: s.emailRefinementHistory,
  };
}

interface RefinementEntry {
  feedback: string;
  changeDescription: string;
  timestamp: string;
}

export default function EmailPage() {
  const store = useCaseStore();
  const [draft, setDraft] = useState<{
    subject: string;
    body: string;
    recipientEmail: string;
    recipientName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState("");
  const [refining, setRefining] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<RefinementEntry[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());

  const escalationLevel: EscalationLevel = "grievance-email";

  useEffect(() => {
    let cancelled = false;

    async function loadDraft() {
      setLoading(true);
      setError(null);
      const caseData = snapshotCaseState();

      if (!caseData.userNarrative) {
        setError("No case data found. Please complete a voice conversation first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/draft-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseState: caseData, escalationLevel }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.subject && data.body) {
            setDraft({
              subject: data.subject,
              body: data.body,
              recipientEmail: data.recipientEmail || caseData.company?.grievanceEmail || "",
              recipientName: data.recipientName || caseData.company?.name || "",
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through
      }

      if (!cancelled) {
        setError("Could not generate email. Please try again.");
        setLoading(false);
      }
    }

    loadDraft();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function findChangedSentences(oldBody: string, newBody: string): Set<string> {
    const oldSentences = new Set(oldBody.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean));
    const newSentences = newBody.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
    const changed = new Set<string>();
    for (const s of newSentences) {
      if (!oldSentences.has(s) && s.length > 5) {
        changed.add(s);
      }
    }
    return changed;
  }

  async function handleRefine() {
    if (!feedback.trim() || !draft || refining) return;
    setRefining(true);

    try {
      const caseState = snapshotCaseState();
      const res = await fetch("/api/refine-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: { subject: draft.subject, body: draft.body },
          userFeedback: feedback.trim(),
          caseContext: {
            narrative: caseState.userNarrative,
            companyName: caseState.company?.name,
            purchaseDate: caseState.extractedData.purchaseDate,
            amountPaid: caseState.extractedData.amountPaid,
          },
        }),
      });

      if (!res.ok) throw new Error("Refinement failed");
      const data = await res.json();

      const oldBody = draft.body;
      setDraft({
        ...draft,
        subject: data.subject || draft.subject,
        body: data.body || draft.body,
      });

      if (data.body) {
        setHighlightedSentences(findChangedSentences(oldBody, data.body));
      }

      const refinementEntry = {
        feedback: feedback.trim(),
        changeDescription: data.changeDescription || "Updated email",
        timestamp: new Date().toISOString(),
      };
      setRefinementHistory(prev => [...prev, refinementEntry]);
      store.addEmailRefinement(refinementEntry);
      setFeedback("");
    } catch {
      // Show inline error
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="text-lg">ProjectL Voice</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Start new conversation
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-2xl font-semibold text-white"
        >
          Your Grievance Email
        </motion.h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="ml-3 text-slate-400">Drafting your email...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        ) : draft ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <EmailPreview
              to={draft.recipientEmail}
              subject={draft.subject}
              body={draft.body}
              highlightedSentences={highlightedSentences}
            />

            {/* Refinement panel */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-300">
                Want to change something?
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Tell us what to add, remove, or change. Examples: &quot;add the invoice number INV-1234&quot;, &quot;make it more formal&quot;, &quot;mention I called 3 times&quot;
              </p>
              <div className="flex gap-2">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRefine();
                    }
                  }}
                  placeholder="Type your change request..."
                  rows={2}
                  className="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={refining}
                />
                <Button
                  onClick={handleRefine}
                  disabled={!feedback.trim() || refining}
                  size="icon"
                  className="h-auto bg-indigo-600 hover:bg-indigo-500"
                >
                  {refining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {refinementHistory.length > 0 && (
                <div className="mt-3 border-t border-slate-700/50 pt-3">
                  <button
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="flex w-full items-center justify-between text-xs text-slate-500 hover:text-slate-300"
                  >
                    <span>{refinementHistory.length} change{refinementHistory.length > 1 ? "s" : ""} made</span>
                    {historyExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {historyExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {refinementHistory.map((entry, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                          <span className="text-slate-400">{entry.changeDescription}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <SendOptions
              to={draft.recipientEmail}
              subject={draft.subject}
              body={draft.body}
            />
          </motion.div>
        ) : null}
      </main>
    </div>
  );
}
