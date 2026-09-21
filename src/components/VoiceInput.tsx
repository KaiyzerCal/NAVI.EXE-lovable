import React, { useState, useRef, useCallback } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

// Every code the Web Speech API actually emits, mapped to something a user
// can act on. Before this, only "not-allowed" showed anything — every other
// case (by far the most common being "no-speech", which fires whenever the
// mic times out without hearing anything) left the button silently drop back
// to idle with zero explanation. That's the "I tap it and nothing happens"
// symptom: it wasn't doing nothing, it was failing silently on paths this
// code never surfaced.
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access required for voice input.",
  "service-not-allowed": "Microphone blocked in this context (often an embedded preview — try the published app URL directly).",
  "no-speech": "Didn't catch any speech — try again and speak right after tapping.",
  "audio-capture": "No microphone found, or it's in use by another app or tab.",
  network: "Voice recognition network error — check your connection and try again.",
  aborted: "Voice input was interrupted.",
  "language-not-supported": "This browser doesn't support English speech recognition.",
};

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMsg(msg);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
  }, []);

  const toggle = useCallback(() => {
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }

    setErrorMsg(null);
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      showError(ERROR_MESSAGES[event.error] ?? `Voice input error: ${event.error}`);
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    try {
      recognition.start();
      setRecording(true);
    } catch (err) {
      // Previously swallowed entirely — e.g. an "already started" exception
      // from a stale instance, or a Permissions-Policy block on `start()`
      // itself (distinct from the onerror "service-not-allowed" case, which
      // only fires for a block discovered *after* start() succeeds). Both
      // used to look identical to a healthy idle button.
      const detail = err instanceof Error ? err.message : undefined;
      showError(detail ? `Couldn't start voice input: ${detail}` : "Couldn't start voice input.");
      setRecording(false);
    }
  }, [recording, onTranscript, showError]);

  if (!SpeechRecognitionAPI) return null;

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-30 ${
          recording
            ? "bg-destructive/20 border border-destructive/40 text-destructive"
            : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
        }`}
      >
        {recording ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Mic size={14} />
          </motion.div>
        ) : (
          <Mic size={14} />
        )}
      </button>
      {errorMsg && (
        <p className="absolute bottom-full mb-1 right-0 max-w-[220px] text-[9px] font-mono text-destructive whitespace-normal bg-card border border-border rounded px-2 py-1 z-10">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
