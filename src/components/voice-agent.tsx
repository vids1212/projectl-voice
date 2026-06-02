"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceAgent() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const conversation = useConversation({
    onConnect: () => setErrorMessage(""),
    onDisconnect: () => {},
    onMessage: (message) => console.log("Agent message:", message),
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
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    await conversation.setVolume({ volume: isMuted ? 1 : 0 });
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated orb */}
      <div className="relative flex h-48 w-48 items-center justify-center">
        {/* Outer pulse rings */}
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

        {/* Main orb */}
        <motion.div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full ${
            isConnected
              ? "bg-gradient-to-br from-indigo-500 to-violet-600"
              : "bg-gradient-to-br from-slate-700 to-slate-800"
          }`}
          animate={
            isConnected && isSpeaking
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
            boxShadow: isConnected
              ? "0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(99,102,241,0.1)"
              : "0 0 30px rgba(0,0,0,0.3)",
          }}
        >
          {/* Waveform bars inside orb */}
          {isConnected && (
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

          {!isConnected && <Mic className="h-10 w-10 text-slate-400" />}
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center">
        {isConnected && isSpeaking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-indigo-300"
          >
            Agent is speaking...
          </motion.p>
        )}
        {isConnected && !isSpeaking && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-medium text-slate-400"
          >
            Listening...
          </motion.p>
        )}
        {!isConnected && !errorMessage && (
          <p className="text-slate-500">
            Tap the button below to start talking
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}
        {!hasPermission && !errorMessage && (
          <p className="text-sm text-amber-400">
            Microphone access is required
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {isConnected ? (
          <>
            <Button
              onClick={stopConversation}
              variant="outline"
              size="lg"
              className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <MicOff className="h-5 w-5" />
              End Conversation
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
