import PageHeader from "@/components/PageHeader";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed (${resp.status})`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Systems online, Operator. MAVIS initialized. How can I assist you today?",
    timestamp: new Date(),
  },
];

export default function MavisChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const chatHistory = updatedMessages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    try {
      await streamChat({
        messages: chatHistory,
        onDelta: (chunk) => {
          assistantContent += chunk;
          const content = assistantContent;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content } : m
              );
            }
            return [
              ...prev,
              { id: "streaming", role: "assistant", content, timestamp: new Date() },
            ];
          });
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming" ? { ...m, id: Date.now().toString() } : m
            )
          );
          setIsLoading(false);
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({
        title: "MAVIS Error",
        description: e.message || "Failed to get response",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <PageHeader title="MAVIS AI" subtitle="// NEURAL LINK ACTIVE" />

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
                msg.role === "assistant"
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-neon-purple/10 border border-neon-purple/30"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot size={14} className="text-primary" />
              ) : (
                <User size={14} className="text-neon-purple" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded px-3 py-2 ${
                msg.role === "assistant"
                  ? "bg-card border border-border"
                  : "bg-neon-purple/10 border border-neon-purple/20"
              }`}
            >
              <div className="text-sm font-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border border-border rounded bg-card flex items-center gap-2 p-2 border-glow">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message MAVIS..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none px-2 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
