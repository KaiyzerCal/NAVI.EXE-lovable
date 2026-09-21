import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic } from "lucide-react";
import { motion } from "framer-motion";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// The raw browser Web Speech API (window.webkitSpeechRecognition) was the
// previous implementation here. On Android specifically that path can never
// actually work: the WebView's own SpeechRecognition checks the app's
// RECORD_AUDIO grant internally, but nothing in a plain WebView ever *asks*
// for that grant — Capacitor's default WebView permission handling only
// checks whether a permission is already granted, it doesn't trigger the
// native "Allow microphone?" dialog on its own. Declaring RECORD_AUDIO in
// the manifest made the permission grantable; nothing was ever requesting
// it, so every attempt failed as "not-allowed" with no prompt, permanently.
//
// This plugin (native SpeechRecognizer on Android, SFSpeechRecognizer on
// iOS, same Web Speech API as before in the browser) has real permission
// lifecycle support — checkPermissions/requestPermissions go through
// Capacitor's plugin permission machinery, which does correctly call
// Android's ActivityCompat.requestPermissions and show the dialog. Same
// pattern as swapping window.speechSynthesis for
// @capacitor-community/text-to-speech on the output side.

// Turns whatever error message the plugin/browser surfaces into something
// specific and actionable, rather than a single generic string — the
// previous version's exact mistake, just against a different API shape.
function messageFor(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.toLowerCase();
  if (m.includes("permission") || m.includes("denied")) {
    return "Microphone access required for voice input.";
  }
  if (m.includes("not available") || m.includes("unavailable") || m.includes("not supported")) {
    return "Speech recognition isn't available on this device.";
  }
  if (m.includes("no match") || m.includes("no speech") || m.includes("speech timeout")) {
    return "Didn't catch any speech — try again and speak right after tapping.";
  }
  if (m.includes("network")) {
    return "Voice recognition network error — check your connection and try again.";
  }
  return raw || "Voice input error.";
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Starts true so the button doesn't flash-hide before the async
  // available() check resolves; only hides once genuinely confirmed absent.
  const [supported, setSupported] = useState(true);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    SpeechRecognition.available()
      .then(({ available }) => setSupported(available))
      .catch(() => setSupported(false));
  }, []);

  const showError = useCallback((msg: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMsg(msg);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 4000);
  }, []);

  const toggle = useCallback(async () => {
    if (recording) {
      try { await SpeechRecognition.stop(); } catch { /* already stopped */ }
      setRecording(false);
      return;
    }

    setErrorMsg(null);
    try {
      const status = await SpeechRecognition.checkPermissions();
      let granted = status.speechRecognition === "granted";
      if (!granted) {
        const req = await SpeechRecognition.requestPermissions();
        granted = req.speechRecognition === "granted";
      }
      if (!granted) {
        showError("Microphone access required for voice input.");
        return;
      }

      setRecording(true);
      // No partialResults: this is single-utterance dictation into a text
      // box, not a live transcript view, and the plugin's partial-result
      // events don't document whether each one is a delta or the full
      // transcript-so-far — appending the wrong shape onto the input would
      // duplicate text. Waiting for the one final result sidesteps that
      // entirely and matches what this button has always actually done.
      const { matches } = await SpeechRecognition.start({ language: "en-US", popup: false });
      if (matches?.[0]) onTranscript(matches[0]);
    } catch (err) {
      showError(messageFor(err));
    } finally {
      setRecording(false);
    }
  }, [recording, onTranscript, showError]);

  if (!supported) return null;

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
