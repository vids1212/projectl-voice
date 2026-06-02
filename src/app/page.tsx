"use client";

import { motion } from "framer-motion";
import { Scale, MessageSquare, Shield, Clock } from "lucide-react";
import VoiceAgent from "@/components/voice-agent";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Just Talk",
    description:
      "Describe your consumer dispute in your own words — no typing needed.",
  },
  {
    icon: Shield,
    title: "Smart Follow-ups",
    description:
      "The agent asks targeted questions to build a strong case.",
  },
  {
    icon: Clock,
    title: "Under 5 Minutes",
    description:
      "Get from problem description to a ready grievance email draft.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Scale className="h-5 w-5" />
            <span className="text-lg">ProjectL Voice</span>
          </div>
          <span className="text-xs text-slate-500">
            Powered by ElevenLabs
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
            Voice Assistant
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Tell us what happened
            <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              using your voice
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Speak naturally about your consumer dispute. Our AI assistant will
            listen, ask follow-ups, and help prepare your grievance.
          </p>
        </motion.div>

        {/* Voice Agent */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-8 sm:p-12 backdrop-blur-sm"
        >
          <VoiceAgent />
        </motion.div>

        {/* Feature cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <f.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-12 text-center text-xs text-slate-600">
          Powered by ElevenLabs &middot; Requires microphone access &middot;
          Your audio is processed in real-time and not stored
        </p>
      </main>
    </div>
  );
}
