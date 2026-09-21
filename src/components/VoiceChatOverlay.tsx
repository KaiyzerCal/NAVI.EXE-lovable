// Turn-based voice conversation with NAVI: tap to speak, NAVI listens,
// sends what you said to chat, speaks the reply, then listens again —
// a phone-call-style loop instead of one dictation-then-manual-send at a
// time. Ported from mythos-vantara's VoiceChatOverlay (same product, same
// underlying plugins), trimmed for what NAVI actually has:
//   - No persona mode — NAVI has one voice, not a roster of council
//     members/personas with their own conversation history to load.
//   - No "Live Mode" real-time WebSocket streaming — that needs a realtime
//     voice backend (mavis-live-voice or equivalent) this app doesn't have;
//     shipping the toggle without it would just be a dead button.
//   - TTS goes through the already-ported useElevenLabsTts hook instead of
//     Vantara's separate speakReply/speakReplyNative/speakWithElevenLabs
//     trio, so there's one voice-output implementation in this app, not two
//     that could drift out of sync.
// The listening logic (native + web) is kept close to verbatim — it encodes
// real, hard-won fixes (native plugin quirks, Chrome's silence handling,
// interim-transcript merging) that aren't worth re-discovering from scratch.
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Pause, Square } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition as NativeSpeechRecognition } from "@capacitor-community/speech-recognition";
import { useElevenLabsTts } from "@/hooks/useElevenLabsTts";

// Minimal local shapes for the browser Web Speech API (web fallback path
// only — native listening goes through @capacitor-community/speech-
// recognition, which ships its own types). Not in this project's DOM lib,
// and only a handful of fields are actually touched here.
interface WebSpeechResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface WebSpeechRecognitionEvent {
  results: ArrayLike<WebSpeechResult>;
}
interface WebSpeechRecognitionErrorEvent {
  error: string;
}
interface WebSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type WebSpeechRecognitionCtor = new () => WebSpeechRecognition;

// Screen Wake Lock API — also not in this project's DOM lib.
interface WakeLockSentinelLike {
  release(): Promise<void>;
  onrelease: (() => void) | null;
}

interface VoiceChatOverlayProps {
  onClose: () => void;
  sendMessage: (text: string) => Promise<void>;
  lastBotMessage?: string;
  isLoading?: boolean;
}

type Phase = "idle" | "listening" | "thinking" | "speaking";

export function VoiceChatOverlay({ onClose, sendMessage, lastBotMessage = "", isLoading = false }: VoiceChatOverlayProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  // Karaoke-style word reveal while speaking — a timed simulation rather than
  // real audio boundaries, since useElevenLabsTts doesn't expose per-word
  // timing (it wraps three different playback mechanisms — native TTS,
  // browser speechSynthesis, ElevenLabs — behind one speak()/stop() surface,
  // and boundary events don't exist uniformly across all three).
  const [spokenUpTo, setSpokenUpTo] = useState(0);
  const [displayedReply, setDisplayedReply] = useState("");

  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const autoRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const karaokeTickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const replyScrollRef = useRef<HTMLDivElement>(null);
  const spokenWordRef = useRef<HTMLSpanElement>(null);

  const { speak: ttsSpeak, stop: ttsStop } = useElevenLabsTts();

  const prevLoadingRef = useRef(isLoading);
  const lastBotMessageRef = useRef(lastBotMessage);
  useEffect(() => { lastBotMessageRef.current = lastBotMessage; }, [lastBotMessage]);

  // Stable ref so startListening doesn't change identity on every parent
  // render — an identity change here would cancel the 1s auto-restart timer
  // below and silently stop the loop after the first turn.
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  const speakReply = useCallback((text: string) => {
    if (!text || closingRef.current) return;
    setDisplayedReply(text);
    setSpokenUpTo(0);
    setPhase("speaking");

    // Same word-timing simulation as the auto-speak path elsewhere in this
    // app: no real boundary events to hook, so estimate ~140ms/word and
    // reveal accordingly. Cosmetic only — actual audio timing may drift
    // slightly, which is an acceptable tradeoff for not needing a second
    // TTS implementation just to get real boundaries.
    const words = text.split(/\s+/);
    let charPos = 0;
    let wordIdx = 0;
    const tick = () => {
      if (wordIdx >= words.length || closingRef.current) {
        setSpokenUpTo(text.length);
        return;
      }
      charPos += words[wordIdx].length + 1;
      setSpokenUpTo(Math.min(charPos, text.length));
      wordIdx++;
      spokenWordRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      karaokeTickRef.current = setTimeout(tick, 140);
    };
    karaokeTickRef.current = setTimeout(tick, 140);

    ttsSpeak(text, { gender: "female", voiceId: "EXAVITQu4vr4xnSDxMaL" }).finally(() => {
      if (karaokeTickRef.current) { clearTimeout(karaokeTickRef.current); karaokeTickRef.current = null; }
      setSpokenUpTo(text.length);
      if (!closingRef.current) setPhase("idle");
    });
  }, [ttsSpeak]);

  // ── Transition: thinking → speaking when a reply arrives ───────────────
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && phase === "thinking" && !closingRef.current) {
      const msg = lastBotMessageRef.current;
      if (msg) speakReply(msg);
      else setPhase("idle");
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, phase, speakReply]);

  // ── Voice input ──────────────────────────────────────────────────────
  // Android's native WebView has no Web Speech API at all — window.
  // SpeechRecognition / webkitSpeechRecognition are simply undefined there,
  // not just restricted. Native builds go through
  // @capacitor-community/speech-recognition instead, which wraps Android's
  // real SpeechRecognizer and has actual permission-request support (see
  // VoiceInput.tsx for the fuller story on why the raw Web API can't
  // request that permission itself even when it exists).
  const stopListening = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      NativeSpeechRecognition.stop().catch(() => {});
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  }, []);

  // The native plugin's start() promise resolves once, immediately, with no
  // matches — it is not the "recognition finished" signal. The real signal
  // is the listeningState event going to "stopped". The plugin also exposes
  // no error event, so a user who never speaks at all (ERROR_SPEECH_TIMEOUT
  // on the native side) would otherwise leave the UI stuck on "listening"
  // forever — the safety timer below exists specifically for that case, and
  // is reset (not just set once) on every partial result so someone who IS
  // talking doesn't get cut off mid-sentence.
  const startListeningNative = useCallback(async () => {
    try {
      const { speechRecognition } = await NativeSpeechRecognition.checkPermissions();
      if (speechRecognition !== "granted") {
        const req = await NativeSpeechRecognition.requestPermissions();
        if (req.speechRecognition !== "granted") { setPhase("idle"); return; }
      }
    } catch {
      setPhase("idle");
      return;
    }

    await NativeSpeechRecognition.removeAllListeners();
    let lastPartial = "";
    let finished = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const finalize = () => {
      if (finished) return;
      finished = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      NativeSpeechRecognition.removeAllListeners().catch(() => {});
      if (closingRef.current) return;
      const captured = lastPartial;
      if (captured) {
        setPhase("thinking");
        setTranscript("");
        setInterimTranscript("");
        sendMessageRef.current(captured).catch(() => {
          if (!closingRef.current) setPhase("idle");
        });
      } else {
        setPhase("idle");
      }
    };

    const NATIVE_SILENCE_MS = 15000;
    const armSilenceTimer = () => {
      if (finished) return;
      if (safetyTimer) clearTimeout(safetyTimer);
      safetyTimer = setTimeout(finalize, NATIVE_SILENCE_MS);
    };

    await NativeSpeechRecognition.addListener("partialResults", (data) => {
      const text = data.matches?.[0]?.trim() ?? "";
      if (text) { lastPartial = text; setInterimTranscript(text); }
      armSilenceTimer();
    });
    await NativeSpeechRecognition.addListener("listeningState", (data) => {
      if (data.status === "stopped") finalize();
    });

    setTranscript("");
    setInterimTranscript("");
    setPhase("listening");

    try {
      armSilenceTimer();
      await NativeSpeechRecognition.start({ language: "en-US", partialResults: true, popup: false });
    } catch {
      finished = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      await NativeSpeechRecognition.removeAllListeners().catch(() => {});
      if (!closingRef.current) setPhase("idle");
    }
  }, []);

  const startListening = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      startListeningNative();
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: WebSpeechRecognitionCtor;
      webkitSpeechRecognition?: WebSpeechRecognitionCtor;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let lastCapturedText = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    const SILENCE_MS = 14000;

    const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

    // Chrome's continuous+interim mode re-emits growing/overlapping segments
    // rather than clean deltas. This stitches them into one coherent string
    // instead of duplicating words on every event.
    const mergeSegments = (segments: string[]) => {
      const cleaned = segments.map(normalize).filter(Boolean);
      if (cleaned.length === 0) return "";
      const merged: string[] = [];
      for (const segment of cleaned) {
        const nextWords = segment.split(" ").filter(Boolean);
        if (nextWords.length === 0) continue;
        if (merged.length === 0) { merged.push(...nextWords); continue; }
        const mergedText = merged.join(" ").toLowerCase();
        const nextText = nextWords.join(" ").toLowerCase();
        if (nextText === mergedText || mergedText.endsWith(nextText)) continue;
        if (nextText.startsWith(mergedText)) { merged.splice(0, merged.length, ...nextWords); continue; }
        let overlap = 0;
        const maxOverlap = Math.min(merged.length, nextWords.length);
        for (let size = maxOverlap; size > 0; size--) {
          const tail = merged.slice(-size).join(" ").toLowerCase();
          const head = nextWords.slice(0, size).join(" ").toLowerCase();
          if (tail === head) { overlap = size; break; }
        }
        if (overlap > 0) { merged.push(...nextWords.slice(overlap)); continue; }
        merged.push(...nextWords);
      }
      return merged.join(" ");
    };

    const syncTranscriptState = (results: ArrayLike<WebSpeechResult>) => {
      const finalSegments: string[] = [];
      const interimSegments: string[] = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const text = normalize(result?.[0]?.transcript ?? "");
        if (!text) continue;
        if (result.isFinal) finalSegments.push(text); else interimSegments.push(text);
      }
      const confirmed = mergeSegments(finalSegments);
      const live = mergeSegments(interimSegments);
      const fullCapture = mergeSegments([confirmed, live].filter(Boolean));
      lastCapturedText = fullCapture;

      if (!confirmed) { setTranscript(""); setInterimTranscript(fullCapture); return; }
      if (!fullCapture || fullCapture.toLowerCase() === confirmed.toLowerCase()) {
        setTranscript(confirmed); setInterimTranscript(""); return;
      }
      const confirmedLower = confirmed.toLowerCase();
      const fullLower = fullCapture.toLowerCase();
      if (fullLower.startsWith(confirmedLower)) {
        setTranscript(confirmed);
        setInterimTranscript(normalize(fullCapture.slice(confirmed.length)));
        return;
      }
      setTranscript(""); setInterimTranscript(fullCapture);
    };

    function resetSilenceTimer() {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => { if (recognitionRef.current) recognitionRef.current.stop(); }, SILENCE_MS);
    }

    recognition.onresult = (event) => { syncTranscriptState(event.results); resetSilenceTimer(); };
    recognition.onerror = (event) => {
      // no-speech: Chrome fires this on a pause — let the silence timer
      // handle it instead of killing the session. aborted: we did it
      // ourselves via recognition.abort(), no phase change needed.
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (silenceTimer) clearTimeout(silenceTimer);
      recognitionRef.current = null;
      if (!closingRef.current) setPhase("idle");
    };
    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      recognitionRef.current = null;
      if (closingRef.current) return;
      const captured = normalize(lastCapturedText);
      if (captured) {
        setPhase("thinking");
        setTranscript("");
        setInterimTranscript("");
        sendMessageRef.current(captured).catch(() => {
          if (!closingRef.current) setPhase("idle");
        });
      } else {
        setPhase("idle");
      }
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setInterimTranscript("");
    recognition.start();
    setPhase("listening");
  }, [startListeningNative]);

  // Auto-restart listening once idle, so the conversation keeps going
  // without a tap between every turn.
  useEffect(() => {
    if (phase === "idle" && !closingRef.current) {
      autoRestartTimerRef.current = setTimeout(() => {
        if (!closingRef.current) startListening();
      }, 1000);
    }
    return () => {
      if (autoRestartTimerRef.current) { clearTimeout(autoRestartTimerRef.current); autoRestartTimerRef.current = null; }
    };
  }, [phase, startListening]);

  const handleClose = useCallback(() => {
    closingRef.current = true;
    if (autoRestartTimerRef.current) clearTimeout(autoRestartTimerRef.current);
    if (karaokeTickRef.current) clearTimeout(karaokeTickRef.current);
    stopListening();
    ttsStop();
    onClose();
  }, [onClose, stopListening, ttsStop]);

  // Keep the screen awake while the overlay is open — a mid-reply screen
  // timeout would cut off speech or kill the listening session.
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinelLike | null = null;
    const nav = navigator as unknown as { wakeLock: { request(type: "screen"): Promise<WakeLockSentinelLike> } };
    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock.request("screen");
        wakeLockRef.current = sentinel;
        sentinel.onrelease = () => { wakeLockRef.current = null; };
      } catch { /* not supported or denied — non-fatal */ }
    };
    acquire();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  // Orb (top) and bottom mic button do the same thing: tap-to-speak when
  // idle, stop when listening/speaking. useElevenLabsTts has no pause/resume
  // of its own (its three backends — native, browser, ElevenLabs — don't
  // share one), so a tap while speaking stops outright rather than pausing,
  // same limitation Vantara has for its native-TTS path.
  const handleOrbTap = useCallback(() => {
    if (phase === "idle") startListening();
    else if (phase === "listening") { if (recognitionRef.current) recognitionRef.current.stop(); else stopListening(); }
    else if (phase === "thinking") setPhase("idle");
    else if (phase === "speaking") {
      ttsStop();
      setPhase("idle");
    }
  }, [phase, startListening, stopListening, ttsStop]);

  const handleStopTap = useCallback(() => {
    if (phase === "idle") startListening();
    else if (phase === "listening") { if (recognitionRef.current) recognitionRef.current.stop(); else stopListening(); }
    else if (phase === "thinking") setPhase("idle");
    else if (phase === "speaking") {
      ttsStop();
      setPhase("idle");
    }
  }, [phase, startListening, stopListening, ttsStop]);

  const phaseLabel: Record<Phase, string> = {
    idle: "TAP TO SPEAK",
    listening: "LISTENING — pause ~10s to send",
    thinking: "THINKING... — TAP TO CANCEL",
    speaking: "TAP TO STOP",
  };

  const spoken = displayedReply.slice(0, spokenUpTo);
  const remaining = displayedReply.slice(spokenUpTo);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[2px] px-6"
    >
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 p-2 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all"
        aria-label="Close voice mode"
      >
        <X size={20} />
      </button>

      <div className="absolute top-5 left-6 flex items-center gap-2.5">
        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary/80 font-display">N</span>
        </div>
        <p className="text-xs font-mono font-bold text-primary tracking-widest">NAVI</p>
      </div>

      <button
        onClick={handleOrbTap}
        className={[
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 overflow-hidden",
          "bg-primary/20 border-2 border-primary/40",
          phase === "listening" ? "animate-pulse scale-110" : "",
          phase === "speaking" ? "shadow-[0_0_40px_rgba(139,92,246,0.5)] scale-105" : "",
        ].filter(Boolean).join(" ")}
        aria-label={phase === "speaking" ? "Stop" : undefined}
      >
        <span className={[
          "absolute inset-1 rounded-full border-2 border-transparent border-t-primary/70 z-10",
          phase === "thinking" ? "animate-spin" : "opacity-0",
        ].join(" ")} />
        {phase === "speaking"
          ? <Pause size={28} className="text-primary" />
          : <Mic size={28} className={phase === "listening" ? "text-primary" : "text-primary/60"} />}
      </button>

      <p className="text-xs font-mono tracking-widest text-primary">{phaseLabel[phase]}</p>

      <AnimatePresence>
        {(interimTranscript || transcript) && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md px-4"
          >
            <p className="text-xs font-mono text-primary/50 tracking-widest text-center mb-1 uppercase">You</p>
            <p className="text-center text-sm font-mono leading-relaxed break-words">
              {transcript && <span className="text-white/90">{transcript}</span>}
              {transcript && interimTranscript && " "}
              {interimTranscript && <span className="text-white/50 italic">{interimTranscript}</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {displayedReply ? (
        <div ref={replyScrollRef} className="w-full max-w-lg max-h-56 overflow-y-auto rounded-lg px-1 py-1" style={{ scrollbarWidth: "none" }}>
          <p className="text-center text-sm font-mono leading-relaxed break-words">
            <span className="text-white">{spoken}</span>
            <span ref={spokenWordRef} />
            <span className="text-white/30">{remaining}</span>
          </p>
        </div>
      ) : phase === "thinking" ? (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      ) : null}

      <button
        onClick={handleStopTap}
        className={[
          "absolute bottom-12 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-2",
          phase === "listening" || phase === "speaking"
            ? "bg-destructive/20 border-destructive/50 text-destructive"
            : "bg-primary/10 border-primary/30 text-primary/70 hover:bg-primary/20 hover:text-primary",
          phase === "listening" ? "animate-pulse" : "",
        ].filter(Boolean).join(" ")}
        aria-label={phase === "speaking" ? "Stop" : phase === "listening" ? "Stop" : "Speak"}
      >
        {phase === "speaking" ? <Square size={28} /> : <Mic size={32} />}
      </button>
    </motion.div>
  );
}
