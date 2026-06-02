"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCaseStore } from "@/lib/case-store";

interface TranscriptMessage {
  source: "user" | "agent";
  text: string;
}

export default function VoiceAgent() {
  const router = useRouter();
  const store = useCaseStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptMessage[]>([]);

  const conversation = useConversation({
    onConnect: () => setErrorMessage(""),
    onDisconnect: () => {
      // When conversation ends, process the transcript
      if (transcriptRef.current.length > 0) {
        processTranscript();
      }
    },
    onMessage: (message: { source?: string; message?: string; role?: string; content?: string }) => {
      // ElevenLabs sends messages with varying shapes
      const source = (message.source === "user" || message.role === "user") ? "user" : "agent";
      const text = message.message || message.content || "";
      if (text) {
        const entry: TranscriptMessage = { source, text };
        transcriptRef.current = [...transcriptRef.current, entry];
        setTranscriptLines(prev => [...prev, entry]);
      }
    },
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
    },
  });

  const { status, isSpeaking } = conversation;
  const isConnected = status === "connected";

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setErrorMessage("Microphone access denied"));
  }, []);

  const startConversation = useCallback(async () => {
    try {
      setErrorMessage("");
      // Reset transcript for new conversation
      transcriptRef.current = [];
      setTranscriptLines([]);
      store.reset();

      // Try signed URL first (private agent with server-side key)
      const res = await fetch("/api/signed-url");
      if (res.ok) {
        const { signedUrl } = await res.json();
        await conversation.startSession({ signedUrl });
        return;
      }

      // Fall back to public agent ID
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        setErrorMessage(
          "No agent configured. Set ELEVENLABS_AGENT_ID or NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local"
        );
        return;
      }
      await conversation.startSession({ agentId });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start conversation"
      );
    }
  }, [conversation, store]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    await conversation.setVolume({ volume: isMuted ? 1 : 0 });
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  async function processTranscript() {
    setProcessing(true);
    try {
      const fullTranscript = transcriptRef.current
        .map((m) => `${m.source === "user" ? "Consumer" : "Assistant"}: ${m.text}`)
        .join("\n");

      // Step 1: Extract case details from transcript
      const extractRes = await fetch("/api/extract-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript }),
      });

      if (!extractRes.ok) throw new Error("Failed to extract details");
      const extracted = await extractRes.json();

      // Step 2: Update case store with extracted data
      if (extracted.narrative) {
        store.setNarrative(extracted.narrative);
      }
      if (extracted.extractedData) {
        store.updateExtractedData(extracted.extractedData);
      }

      // Step 3: Look up company
      const companyName = extracted.extractedData?.companyName;
      if (companyName) {
        try {
          const lookupRes = await fetch("/api/lookup-company", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName }),
          });
          if (lookupRes.ok) {
            const companyData = await lookupRes.json();
            if (companyData.found) {
              store.setCompany({
                name: companyData.companyName,
                type: "company",
                grievanceEmail: companyData.grievanceEmail,
                escalationEmail: companyData.escalationEmail,
                website: companyData.website,
                lookupConfidence: "high",
              });
            } else {
              store.setCompany({
                name: companyName,
                type: "company",
                lookupConfidence: "low",
              });
            }
          }
        } catch {
          // Company lookup failed — not critical
        }
      }

      // Step 4: Navigate to email page
      router.push("/email");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to process conversation"
      );
      setProcessing(false);
    }
  }

  // Manual "I'm done" button for when user finishes but agent doesn't disconnect
  async function handleDone() {
    if (isConnected) {
      await conversation.endSession();
    } else if (transcriptRef.current.length > 0) {
      processTranscript();
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated orb */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        {isConnected && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border border-indigo-500/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border border-violet-500/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
          </>
        )}

        <motion.div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full ${
            processing
              ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : isConnected
              ? "bg-gradient-to-br from-indigo-500 to-violet-600"
              : "bg-gradient-to-br from-slate-700 to-slate-800"
          }`}
          animate={
            processing
              ? { scale: [1, 1.05, 1] }
              : isConnected && isSpeaking
              ? { scale: [1, 1.08, 1, 1.05, 1] }
              : isConnected
              ? { scale: [1, 1.02, 1] }
              : {}
          }
          transition={{
            duration: isSpeaking ? 0.6 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: processing
              ? "0 0 60px rgba(245,158,11,0.3), 0 0 120px rgba(245,158,11,0.1)"
              : isConnected
              ? "0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(99,102,241,0.1)"
              : "0 0 30px rgba(0,0,0,0.3)",
          }}
        >
          {processing && (
            <Loader2 className="h-10 w-10 animate-spin text-white/80" />
          )}

          {isConnected && !processing && (
            <div className="flex items-center gap-1 h-12">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full bg-white/80"
                  animate={{
                    height: isSpeaking
                      ? ["20%", "100%", "30%", "80%", "20%"]
                      : ["20%", "35%", "20%"],
                  }}
                  transition={{
                    duration: isSpeaking ? 0.5 : 1.5,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {!isConnected && !processing && <Mic className="h-10 w-10 text-slate-400" />}
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center">
        {processing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-amber-300"
          >
            Processing your case &amp; drafting email...
          </motion.p>
        )}
        {isConnected && isSpeaking && !processing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-indigo-300"
          >
            Agent is speaking...
          </motion.p>
        )}
        {isConnected && !isSpeaking && !processing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-medium text-slate-400"
          >
            Listening...
          </motion.p>
        )}
        {!isConnected && !errorMessage && !processing && (
          <p className="text-slate-500">
            Tap the button below to start talking
          </p>
        )}
        {errorMessage && !processing && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}
        {!hasPermission && !errorMessage && !processing && (
          <p className="text-sm text-amber-400">
            Microphone access is required
          </p>
        )}
      </div>

      {/* Live transcript */}
      {transcriptLines.length > 0 && (isConnected || processing) && (
        <div className="w-full max-w-md max-h-40 overflow-y-auto rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 space-y-2">
          {transcriptLines.slice(-6).map((msg, i) => (
            <div key={i} className="text-xs">
              <span className={msg.source === "user" ? "text-indigo-400" : "text-slate-500"}>
                {msg.source === "user" ? "You" : "Agent"}:
              </span>{" "}
              <span className="text-slate-400">{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {processing ? null : isConnected ? (
          <>
            <Button
              onClick={handleDone}
              size="lg"
              className="gap-2 bg-indigo-600 px-8 text-base hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
            >
              Done — Draft my email
            </Button>
            <Button
              onClick={stopConversation}
              variant="outline"
              size="lg"
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <MicOff className="h-5 w-5" />
              Cancel
            </Button>
            <Button
              onClick={toggleMute}
              variant="outline"
              size="icon"
              className="border-slate-600 text-slate-400 hover:bg-white/5"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={startConversation}
            disabled={!hasPermission}
            size="lg"
            className="gap-2 bg-indigo-600 px-8 text-base hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            <Mic className="h-5 w-5" />
            Start Talking
          </Button>
        )}
      </div>
    </div>
  );
}
