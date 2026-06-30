import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles, CheckSquare, Calendar, Pin } from "lucide-react";
import { Note } from "../types";

interface SmartNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<Note, "id" | "userId" | "createdAt">) => void;
}

export default function SmartNotesModal({ isOpen, onClose, onSave }: SmartNotesModalProps) {
  const [content, setContent] = useState("");
  const [color, setColor] = useState("white");
  const [isPinned, setIsPinned] = useState(false);
  const [detectedType, setDetectedType] = useState<"Note" | "Task" | "Reminder">("Note");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colors = [
    { id: "white", bg: "bg-slate-800", border: "border-slate-600" },
    { id: "red", bg: "bg-red-500", border: "border-red-400" },
    { id: "orange", bg: "bg-orange-500", border: "border-orange-400" },
    { id: "green", bg: "bg-green-500", border: "border-green-400" },
    { id: "blue", bg: "bg-blue-500", border: "border-blue-400" },
    { id: "purple", bg: "bg-purple-500", border: "border-purple-400" },
    { id: "pink", bg: "bg-pink-500", border: "border-pink-400" },
    { id: "teal", bg: "bg-teal-500", border: "border-teal-400" },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // AI Detection logic (mocked based on keywords)
  useEffect(() => {
    const text = content.toLowerCase();
    if (text.includes("tomorrow") || text.includes("todo") || text.includes("buy") || text.includes("complete")) {
      setDetectedType("Task");
    } else if (text.includes("remind") || text.includes("at") || text.includes("pm") || text.includes("am")) {
      setDetectedType("Reminder");
    } else {
      setDetectedType("Note");
    }
  }, [content]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setContent("");
      setColor("white");
      setIsPinned(false);
      setShowSuccess(false);
      setDetectedType("Note");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!content.trim()) return;
    setIsSaving(true);
    
    // Simulate slight delay for AI processing / saving
    setTimeout(() => {
      onSave({
        content,
        color,
        isPinned,
        type: detectedType
      });
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 500);
  };

  const getSuggestions = () => {
    if (!content.trim()) return [];
    if (detectedType === "Task") return ["Create task", "Add deadline", "Start focus session"];
    if (detectedType === "Reminder") return ["Add to calendar", "Create reminder"];
    return [];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:max-w-lg bg-slate-900 border border-white/10 sm:rounded-2xl rounded-t-2xl z-50 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-400"
                >
                  <Check className="w-8 h-8" />
                </motion.div>
                <h3 className="text-xl font-bold text-white">Note Captured!</h3>
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white leading-tight">Smart Notes</h2>
                      <p className="text-xs text-slate-400">Capture ideas instantly.</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className={`relative rounded-xl border border-white/10 p-4 transition-colors ${color !== "white" ? colors.find(c => c.id === color)?.bg + " bg-opacity-10" : "bg-slate-800/50"}`}>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your note, idea, reminder, or thought..."
                      className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 resize-none min-h-[100px] text-base sm:text-lg"
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                      <div className="text-xs text-slate-500">{content.length}/1000</div>
                      <button 
                        onClick={() => setIsPinned(!isPinned)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-colors ${isPinned ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        Pin this note
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* AI Detection Card */}
                    {content.trim().length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-slate-800/50 border border-indigo-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Detected Type
                          </span>
                          <span className="text-xs text-slate-400">Auto-classified</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["Note", "Task", "Reminder"] as const).map(type => {
                            const icons = { Note: Sparkles, Task: CheckSquare, Reminder: Calendar };
                            const Icon = icons[type];
                            return (
                              <button
                                key={type}
                                onClick={() => setDetectedType(type)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${detectedType === type ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                              >
                                <Icon className="w-4 h-4" />
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Color Selection */}
                    <div>
                      <h4 className="text-xs font-medium text-slate-400 mb-2">Color</h4>
                      <div className="flex gap-2">
                        {colors.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setColor(c.id)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.id ? "border-white scale-110" : "border-transparent hover:scale-105"} ${c.id === "white" ? "bg-slate-700" : c.bg}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    {getSuggestions().length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <h4 className="text-xs font-medium text-slate-400 mb-2">AI Suggestions</h4>
                        <div className="flex flex-wrap gap-2">
                          {getSuggestions().map((suggestion, idx) => (
                            <button key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors border border-white/5">
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 border-t border-white/5 bg-slate-900/80 flex justify-between gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!content.trim() || isSaving}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Create Note"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
