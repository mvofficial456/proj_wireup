import React, { useState, useRef, useEffect } from "react";
import { Task, Habit } from "../types";
import { MessageSquare, Send, Sparkles, User, Terminal, Mic, MicOff } from "lucide-react";
import GlassCard from "./GlassCard";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: "user" | "coach";
  text: string;
}

interface AIChatViewProps {
  tasks: Task[];
  habits: Habit[];
}

export default function AIChatView({ tasks, habits }: AIChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "coach",
      text: "Hello! I am Eve, your productivity coach. Tell me what is on your plate or pick a smart prompt to help me wire up your day!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Speech Recognition API.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const combined = finalTranscript + interimTranscript;
      setInputText((prev) => {
        // If we want to append, we'd do prev + combined. 
        // For simpler interaction, we just replace if typing wasn't happening or append smartly.
        // For now, let's just use the combined as the current input, 
        // or append it to existing text if it was non-empty when recognition started.
        // Actually, replacing input with transcript is easier for a simple dictate tool.
        return combined;
      });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access is required for dictation. Please allow microphone access in your browser settings or refresh the preview.");
      } else {
        console.error("Speech recognition error", event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // To prevent overriding existing text completely, we'll append.
    // So we need to store initial text.
    const initialText = inputText ? inputText + " " : "";
    
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(initialText + transcript);
    };

    recognition.start();
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            text: m.text,
          })),
          tasks,
          habits,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: data.response || "I am processing your schedule block. Take action today!" },
      ]);
    } catch (error) {
      console.error("Chat API Error:", error);
      // Fallback
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: "I had a connection glitch, but my message remains: deep work solves everything. Pick your premium action now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    handleSendMessage(preset);
  };

  const presets = [
    "What should I work on first right now?",
    "Can I complete my highest risk task before Friday?",
    "Give me an absolute motivation kick!",
    "Help me schedule some focused habits today.",
  ];

  return (
    <GlassCard className="h-[70vh] sm:h-[520px] lg:h-[600px] flex flex-col p-0 overflow-hidden border-indigo-500/20 shadow-xl lg:shadow-none w-full">
      {/* Coach Header */}
      <div className="bg-white/5 border-b border-white/10 p-3.5 sm:p-5 flex justify-between items-center bg-gradient-to-r from-[#0A0B14] to-indigo-950/20 shrink-0">
        <div className="flex gap-3 sm:gap-4 items-center">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/10">
              <div className="w-full h-full rounded-full bg-[#0A0B14] flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-[#0A0B14] rounded-full animate-pulse"></span>
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-xs sm:text-sm truncate">Accountability Coach Eve</h4>
            <span className="text-[9px] sm:text-[10px] text-indigo-400 font-bold uppercase tracking-wider truncate block block">Zero-Passive Activator</span>
          </div>
        </div>

        <div className="text-right hidden sm:block shrink-0">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold uppercase rounded-full px-2.5 py-1 tracking-wider border border-indigo-500/20 whitespace-nowrap">
            Coach Status: Guarding deadline
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 font-sans text-[13px] sm:text-sm scrollbar-thin scrollbar-thumb-white/10 transform-gpu" style={{ WebkitOverflowScrolling: "touch" }}>
        {messages.map((m, index) => {
          const isCoach = m.role === "coach";
          return (
            <div key={index} className={`flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[80%] ${isCoach ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                  isCoach
                    ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-400"
                    : "bg-white/10 border-white/20 text-slate-300"
                }`}
              >
                {isCoach ? <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </div>
              <div
                className={`p-3 sm:p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                  isCoach
                    ? "bg-white/5 border border-white/10 text-slate-100 rounded-tl-sm shadow-md"
                    : "bg-indigo-600 border border-indigo-500 text-white rounded-tr-sm"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2 sm:gap-3 mr-auto max-w-[92%] sm:max-w-[80%]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-sm text-slate-400 flex items-center gap-1.5 font-mono text-[11px] sm:text-xs animate-pulse">
              <span>Eve is calculating risk variables...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="px-3.5 sm:px-5 pb-3">
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase mb-2">Frequently Asked questions</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(p)}
                className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 hover:text-indigo-300 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs text-slate-400 transition-all font-bold cursor-pointer active:scale-95 text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="border-t border-white/10 p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md flex gap-2 sm:gap-3 shrink-0">
        <button
          onClick={toggleListening}
          className={`p-3 rounded-xl shadow-lg cursor-pointer transition-colors active:scale-95 shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px] ${
            isListening 
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
          title={isListening ? "Stop listening" : "Start dictation"}
        >
          {isListening ? <MicOff className="w-4 h-4 sm:w-4 sm:h-4" /> : <Mic className="w-4 h-4 sm:w-4 sm:h-4" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputText);
          }}
          placeholder="Ask Eve e.g. What is my top focus score goal..."
          className="flex-1 bg-[#0A0B14]/80 text-white border border-white/10 rounded-xl px-3.5 sm:px-4 py-3 outline-none focus:border-indigo-500 text-[13px] sm:text-sm min-h-[44px]"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || loading}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer transition-colors active:scale-95 shrink-0 flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <Send className="w-4 h-4 sm:w-4 sm:h-4" />
        </button>
      </div>
    </GlassCard>
  );
}
