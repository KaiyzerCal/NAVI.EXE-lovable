import PageHeader from "@/components/PageHeader";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "navi";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  { id: "1", role: "navi", content: "Systems online, Operator. NAVI.EXE initialized. How can I assist you today?", timestamp: new Date() },
  { id: "2", role: "navi", content: "I've noticed you have 7 active quests. Would you like a status briefing?", timestamp: new Date() },
];

export default function MavisChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated Navi response
    setTimeout(() => {
      const responses = [
        "Acknowledged, Operator. Processing your request...",
        "Interesting perspective. Let me analyze that for you.",
        "Roger that. I've logged this to your activity feed.",
        "Affirmative. Your quest progress has been updated.",
        "I've made a note of that in my memory banks.",
      ];
      const naviMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "navi",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, naviMsg]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <PageHeader title="MAVIS AI" subtitle="// NEURAL LINK ACTIVE" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
              msg.role === "navi"
                ? "bg-primary/10 border border-primary/30"
                : "bg-neon-purple/10 border border-neon-purple/30"
            }`}>
              {msg.role === "navi" ? <Bot size={14} className="text-primary" /> : <User size={14} className="text-neon-purple" />}
            </div>
            <div className={`max-w-[75%] rounded px-3 py-2 ${
              msg.role === "navi"
                ? "bg-card border border-border"
                : "bg-neon-purple/10 border border-neon-purple/20"
            }`}>
              <p className="text-sm font-body">{msg.content}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border border-border rounded bg-card flex items-center gap-2 p-2 border-glow">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message NAVI..."
          className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none px-2"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
