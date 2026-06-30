import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { Play, Pause, RotateCcw, Flame, CheckCircle, Zap } from "lucide-react";
import GlassCard from "./GlassCard";

interface FocusModeViewProps {
  tasks: Task[];
  onCompleteSession: (taskId: string, durationMinutes: number) => void;
}

export default function FocusModeView({ tasks, onCompleteSession }: FocusModeViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [presetMinutes, setPresetMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("preferredFocusDuration");
    return saved ? parseInt(saved) : 25;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(presetMinutes * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(3); // Standard display fallback
  const [completedSessions, setCompletedSessions] = useState<number>(1);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSecondsRemaining(presetMinutes * 60);
    setIsActive(false);
  }, [presetMinutes]);

  useEffect(() => {
    if (isActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsRemaining]);

  const handleTimerComplete = () => {
    setIsActive(false);
    setCompletedSessions((prev) => prev + 1);
    setStreakCount((prev) => prev + 1);
    
    // Save to parent state / firebase
    if (selectedTaskId) {
      onCompleteSession(selectedTaskId, presetMinutes);
    } else {
      onCompleteSession("general", presetMinutes);
    }
    
    alert(`Success! You have completed a ${presetMinutes}-minute Deep Work session! Time for a short 5-minute break. ☕`);
    setSecondsRemaining(presetMinutes * 60);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsRemaining(presetMinutes * 60);
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = ((presetMinutes * 60 - secondsRemaining) / (presetMinutes * 60)) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Active Focus Streak</h4>
            <p className="text-xl font-extrabold text-orange-400">{streakCount} Days / {completedSessions} Sessions Today</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-indigo-400 font-bold uppercase">Focus Grade</div>
          <div className="text-lg font-extrabold text-white">A+ Level</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="flex flex-col items-center justify-center py-10">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="100"
                stroke="#6366f1"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="628"
                strokeDashoffset={628 - (628 * progressPercentage) / 100}
                className="transition-all duration-300"
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-5xl font-mono font-bold text-white tracking-widest">{formatTime(secondsRemaining)}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-2">
                {isActive ? "Deep Work Session" : (secondsRemaining < presetMinutes * 60 ? "Paused" : "Ready to focus")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 w-full px-8">
            {!isActive && secondsRemaining === presetMinutes * 60 && (
              <button
                onClick={() => setIsActive(true)}
                className="flex-1 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Start
              </button>
            )}
            
            {isActive && (
              <button
                onClick={() => setIsActive(false)}
                className="flex-1 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5 fill-current" /> Pause
              </button>
            )}

            {!isActive && secondsRemaining < presetMinutes * 60 && (
              <button
                onClick={() => setIsActive(true)}
                className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Resume
              </button>
            )}

            <button
              onClick={resetTimer}
              disabled={secondsRemaining === presetMinutes * 60 && !isActive}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Session Setup
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Bind your deep work timer to any active task and the AI Coach will automatically track and update your completion status.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Select Task Target</label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-900/50 text-white rounded-xl py-3 px-4 outline-none border border-white/10 focus:border-indigo-500 transition-colors"
                >
                  <option value="">General Work (No specific task)</option>
                  {tasks.filter((t) => t.status !== "Completed").map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.priority}] {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-bold uppercase block mb-2">Duration (Minutes)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[15, 25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setPresetMinutes(mins);
                        localStorage.setItem("preferredFocusDuration", mins.toString());
                      }}
                      className={`py-2 px-1 rounded-xl border font-bold text-sm transition-all duration-300 ${
                        presetMinutes === mins
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                  <div className="relative col-span-1">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={presetMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 25;
                        setPresetMinutes(val);
                        localStorage.setItem("preferredFocusDuration", val.toString());
                      }}
                      className={`w-full py-2 px-1 text-center rounded-xl border transition-all duration-300 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none ${
                        ![15, 25, 45, 60, 90].includes(presetMinutes)
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-white/5 border-white/10 text-slate-400 focus:border-indigo-500 focus:bg-indigo-600/10 hover:bg-white/10"
                      }`}
                      placeholder="Custom"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>AI automatically calculates deadline risk reduction following successful completions.</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
