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

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [permError, setPermError] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (recording && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      return;
    }

    setPermError(false);
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
      if (event.error === "not-allowed") {
        setPermError(true);
        setTimeout(() => setPermError(false), 4000);
      }
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    try {
      recognition.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }, [recording, onTranscript]);

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
      {permError && (
        <p className="absolute bottom-full mb-1 right-0 text-[9px] font-mono text-destructive whitespace-nowrap bg-card border border-border rounded px-2 py-1">
          Microphone access required for voice input.
        </p>
      )}
    </div>
  );
}
