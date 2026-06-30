import React, { useState, useRef } from "react";
import { 
  BrainCircuit, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  Shuffle,
  Maximize2,
  Minimize2,
  Mic,
  MicOff
} from "lucide-react";
import { Task, Subtask } from "../types";

interface AddTaskProps {
  onSaveTask: (task: Omit<Task, "id" | "userId" | "createdAt">) => void;
}

export default function AddTaskView({ onSaveTask }: AddTaskProps) {
  // Editable task parameters state
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState<string>(new Date().toISOString().split("T")[0]);
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [difficulty, setDifficulty] = useState<"Low" | "Medium" | "High">("Medium");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [riskScore, setRiskScore] = useState(30);
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High">("Medium");
  const [recommendedDailyPlan, setRecommendedDailyPlan] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  
  // UI states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

    const initialText = title ? title + " " : "";
    
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setTitle(initialText + transcript);
    };

    recognition.start();
  };

  // Add custom manual subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const item: Subtask = {
      id: Math.random().toString(36).substring(7),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, item]);
    setNewSubtaskTitle("");
  };

  // Remove helper
  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(sub => sub.id !== id));
  };

  // Save the full task
  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onSaveTask({
      title,
      deadline: deadline || new Date().toISOString().split("T")[0],
      estimatedHours,
      difficulty,
      priority,
      status: "todo",
      riskScore,
      riskLevel,
      recommendedDailyPlan,
      subtasks
    });

    // Reset fields
    setTitle("");
    setDeadline(new Date().toISOString().split("T")[0]);
    setSubtasks([]);
    setEstimatedHours(3);
    setRecommendedDailyPlan("");
    
    // Success feedback
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400 shrink-0" />
            Add New Task
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Define task scope, deadlines, and break down complex tasks into a micro-step burndown blueprint.
          </p>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-slate-400 hover:text-white shrink-0"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="w-full">
          {/* Structure verification & subtask list */}
          <div className="space-y-4">
            {showSuccess && (
            <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm rounded-xl animate-bounce shadow-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block">Blueprint Integrated!</span>
                Your active task has been successfully saved to your cloud workspace and updated on your scheduler.
              </div>
            </div>
          )}

          <form onSubmit={handleConfirmSave} className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <h3 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 shrink-0" />
                Adjust & Validate AI Parameter Extraction
              </h3>
              <button
                type="submit"
                disabled={!title}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Confirm and Commit Blueprint</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Parsed Task Title</label>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
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
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title (extracted or typed manually)"
                    className="w-full px-3.5 py-3 sm:px-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Calculated Deadline</label>
                <div className="relative group flex items-center">
                  <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={deadline}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in HTMLInputElement.prototype) {
                          e.currentTarget.showPicker();
                        }
                      } catch (err) {}
                    }}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 sm:pl-11 sm:pr-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px] cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:bg-white/10 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:rounded-md [&::-webkit-calendar-picker-indicator]:transition-all"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Estimated Hours</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="number"
                    required
                    min={1}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-3.5 py-3 sm:pl-11 sm:pr-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Difficulty Assessment</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3.5 py-3 sm:px-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                >
                  <option value="Low">Low difficulty (Quick wins)</option>
                  <option value="Medium">Medium difficulty (Standard cognitive work)</option>
                  <option value="High">High difficulty (Intense deep work focus)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Action Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-3 sm:px-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                >
                  <option value="Low">Low priority</option>
                  <option value="Medium">Medium priority</option>
                  <option value="High">High priority</option>
                  <option value="Critical">Critical priority</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Derived Risk Level</label>
                <div className="flex gap-2">
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="flex-1 px-3.5 py-3 sm:px-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={riskScore}
                    onChange={(e) => setRiskScore(parseInt(e.target.value) || 0)}
                    className="w-20 sm:w-24 px-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white text-center focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                    placeholder="%"
                    title="Risk Percentage"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide truncate">Recommended Daily Plan</label>
                <textarea
                  value={recommendedDailyPlan}
                  onChange={(e) => setRecommendedDailyPlan(e.target.value)}
                  placeholder="AI generated daily execution plan..."
                  rows={3}
                  className="w-full px-3.5 py-3 sm:px-4 sm:py-3 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Subtasks Blueprint list */}
            <div className="space-y-3.5 border-t border-white/5 pt-4 sm:pt-5">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Derived Action Blueprints (Subtask steps)
              </label>

              <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1 transform-gpu" style={{ WebkitOverflowScrolling: "touch" }}>
                {subtasks.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2">No subtasks added yet.</p>
                )}
                {subtasks.map((sub, idx) => (
                  <div key={sub.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-950/50 border border-white/5 rounded-xl group/item">
                    <span className="text-xs sm:text-[13px] text-slate-300 font-medium truncate flex-1 min-w-0 pr-3">
                      <span className="text-indigo-400 font-bold font-mono mr-2">{idx + 1}.</span>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-[10px] sm:text-xs text-rose-500 hover:text-rose-400 font-bold px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors active:scale-95 shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Subtask adder row */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Specify custom actionable sub-step"
                  className="flex-1 px-3.5 py-3 sm:px-4 sm:py-2.5 bg-slate-900 border border-white/5 rounded-xl text-[13px] sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-4 py-3 sm:p-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-xl transition-colors cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                >
                  <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
