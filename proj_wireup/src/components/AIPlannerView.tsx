import React, { useState } from "react";
import { Schedule, Task, Habit } from "../types";
import { CalendarRange, Sparkles, RefreshCw, Zap, CheckCircle2, Clock, MapPinCheck } from "lucide-react";
import GlassCard from "./GlassCard";

interface AIPlannerViewProps {
  tasks: Task[];
  habits?: Habit[];
  schedules: Schedule[];
  onGenerateSchedule: () => void;
  onToggleScheduleSlot: (scheduleId: string) => void;
  onRecoverSchedule?: () => void;
  isGeneratingPlan?: boolean;
}

export default function AIPlannerView({
  tasks,
  habits = [],
  schedules,
  onGenerateSchedule,
  onToggleScheduleSlot,
  onRecoverSchedule,
  isGeneratingPlan = false,
}: AIPlannerViewProps) {
  const [activeDay, setActiveDay] = useState<string>("Monday");

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Group schedules by day
  const filteredSchedules = schedules.filter((s) => s.dayOfWeek === activeDay);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-indigo-400" /> AI Active Timeline Planner
          </h3>
          <p className="text-sm text-slate-400">
            Automate deep-work calendar blocks using goals, difficulty margins, and streak protections.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {onRecoverSchedule && (
            <button
              onClick={onRecoverSchedule}
              className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs tracking-wider rounded-xl border border-white/10 transition-all justify-center cursor-pointer uppercase"
            >
              Recover Overdue
            </button>
          )}
          <button
            onClick={onGenerateSchedule}
            disabled={isGeneratingPlan}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 transition-all justify-center cursor-pointer uppercase"
          >
            {isGeneratingPlan ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Re-schedule with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Weekday selector navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {weekdays.map((day) => {
          const hasItems = schedules.some((s) => s.dayOfWeek === day);
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeDay === day
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10 border-indigo-500"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
              } flex items-center gap-1.5`}
            >
              <span>{day}</span>
              {hasItems && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Display slots */}
      <div>
        {isGeneratingPlan ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm tracking-widest animate-pulse font-mono uppercase">Generating timeslots...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="w-12 h-12 text-slate-600 mb-4" />
            <h4 className="text-lg font-bold text-slate-300">No scheduled blocks for {activeDay}</h4>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Let Eve arrange study windows based on your priorities and habits using the Re-schedule AI button above or create manual tasks.
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules.map((schedule) => (
              <div
                key={schedule.id}
                onClick={() => onToggleScheduleSlot(schedule.id)}
                className={`group flex items-center justify-between border rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                  schedule.completed
                    ? "bg-slate-900/60 border-indigo-500/10 opacity-65"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${schedule.completed ? "bg-indigo-950/40 text-indigo-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${schedule.completed ? "text-slate-500 line-through" : "text-white"}`}>
                      {schedule.taskTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {schedule.timeLabel} ({schedule.durationMinutes} mins)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {schedule.completed ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <MapPinCheck className="w-3.5 h-3.5" /> Completed
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase font-bold text-slate-500 select-none group-hover:text-indigo-400 transition-colors">
                      Mark Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine hints bar */}
      <GlassCard className="bg-indigo-900/10 border-indigo-500/20">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight mb-1">Weekly Habits sync</h4>
            <p className="text-xs text-indigo-300 leading-relaxed">
              We tracked that you usually code or solve DSA problems on Tuesday and Wednesday at 7 PM. 
              The schedule automatically factors in these habits to lock your focus windows with minimal friction.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
