import React, { useState } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Compass,
  CheckCircle,
  HelpCircle,
  Award
} from "lucide-react";
import { Task, Schedule } from "../types";

interface CalendarProps {
  tasks: Task[];
  schedules: Schedule[];
}

export default function CalendarView({ tasks, schedules }: CalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(22); // Focus on Monday, June 22, 2026

  // Generate June 2026 calendar data
  // June 1st, 2026 is a Monday. Total days is 30.
  const daysInMonth = 30;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Map each day's items
  const getDayDetails = (dayNum: number) => {
    // Return relative tasks pointing to that relative day of June 2026 (assuming deadline is June XX)
    const dayTasks = tasks.filter(t => {
      const dateObj = new Date(t.deadline);
      return dateObj.getFullYear() === 2026 && 
             dateObj.getMonth() === 5 && // June is 5 in JavaScript
             dateObj.getDate() === dayNum;
    });

    // Match schedules indicating specific day of week
    // June 2026 starts on Monday:
    // Day 1: Monday, Day 2: Tuesday ... Day 7: Sunday
    // Day 8: Monday, Day 9: Tuesday ...
    // Day 22 (current local match): Monday
    const dateOfIndex = new Date(2026, 5, dayNum);
    const textDayOfWeek = dateOfIndex.toLocaleDateString("en-US", { weekday: "long" });
    const daySchedules = schedules.filter(s => s.dayOfWeek === textDayOfWeek);

    return { dayTasks, daySchedules, textDayOfWeek };
  };

  const selectedDetails = selectedDay ? getDayDetails(selectedDay) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          Interactive Action Calendar
        </h2>
        <p className="text-slate-400 text-xs">
          Interactive view representing critical deadlines and active deep study blocks color-coded according to risk percentage indices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: June 2026 Calendar Grid (Span 2) */}
        <div className="lg:col-span-2 glass-panel p-4 sm:p-6 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2">
              June 2026
            </h3>
            <div className="flex gap-1">
              <button className="p-2 sm:p-1.5 hover:bg-white/5 rounded-lg sm:rounded text-slate-400 hover:text-white transition-colors active:scale-95" title="Previous Month">
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <button className="p-2 sm:p-1.5 hover:bg-white/5 rounded-lg sm:rounded text-slate-400 hover:text-white transition-colors active:scale-95" title="Next Month">
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 transform-gpu" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="min-w-[400px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase font-mono mb-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Calendar Day boxes */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysArray.map((day) => {
                  const { dayTasks, daySchedules } = getDayDetails(day);
                  const isSelected = selectedDay === day;
                  const activeDayTasks = dayTasks.filter(t => t.status !== "Completed");
                  const hasHighRisk = activeDayTasks.some(t => t.riskLevel === "High");
                  const hasMediumRisk = activeDayTasks.some(t => t.riskLevel === "Medium");

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square p-1.5 sm:p-2 rounded-lg sm:rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer relative active:scale-95 ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "bg-slate-950/40 border-white/5 hover:bg-slate-900 text-slate-300 hover:border-indigo-500/30"
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs font-bold font-mono">{day}</span>
                      
                      {/* Indicators bottom */}
                      <div className="flex flex-wrap gap-1 mt-auto w-full">
                        {dayTasks.length > 0 && (
                          <span className={`min-w-1.5 sm:w-1.5 h-1.5 grow rounded-full ${hasHighRisk ? "bg-rose-500" : hasMediumRisk ? "bg-amber-500" : "bg-emerald-500"}`} />
                        )}
                        {daySchedules.length > 0 && (
                          <span className="min-w-1.5 sm:w-1.5 h-1.5 grow rounded-full bg-indigo-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 sm:mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded bg-rose-500" /> High Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded bg-amber-500" /> Med Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded bg-emerald-500" /> Low Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded bg-indigo-500" /> Deep Work
            </span>
          </div>

        </div>

        {/* Right Column: Selected day agenda, schedules, tasks (Span 1) */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Clock className="w-4 h-4" />
              Day View Agenda ({selectedDay ? `June ${selectedDay}, 2026` : "Select Day"})
            </h3>

            {selectedDetails ? (
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Day of week: {selectedDetails.textDayOfWeek}
                </span>

                {/* Deadlines today */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Project Deadlines</span>
                  {selectedDetails.dayTasks.length > 0 ? (
                    selectedDetails.dayTasks.map(t => (
                      <div key={t.id} className={`p-3 bg-slate-950/60 border ${t.status === "Completed" ? "border-emerald-500/20 opacity-70" : "border-white/5"} rounded-xl flex items-start gap-3 transition-all`}>
                        {t.status === "Completed" ? (
                          <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${t.riskLevel === "High" ? "text-rose-400" : "text-amber-400"}`} />
                        )}
                        <div>
                          <p className={`text-xs font-bold leading-tight ${t.status === "Completed" ? "text-emerald-100 line-through decoration-emerald-500/50" : "text-white"}`}>{t.title}</p>
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            Effort: {t.estimatedHours}h • {t.status === "Completed" ? "Completed" : `Risk: ${t.riskScore || t.riskPercentage}% (${t.riskLevel})`}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No project deadlines on this day.</p>
                  )}
                </div>

                {/* Study sprints today */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">Recommended AI Study Blocks</span>
                  {selectedDetails.daySchedules.length > 0 ? (
                    selectedDetails.daySchedules.map(s => (
                      <div key={s.id} className="p-3 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-indigo-300">{s.taskTitle}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {s.timeLabel} • {s.durationMinutes} min
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${
                          s.completed ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-300"
                        }`}>
                          {s.completed ? "DONE" : "PENDING"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No scheduled AI deep learning blocks.</p>
                  )}
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Please select any active calendar box to overview schedules.</p>
            )}
          </div>

          {/* Achievement widget */}
          <div className="glass-card p-5 rounded-2xl text-center space-y-2">
            <Award className="w-10 h-10 text-purple-400 mx-auto animate-bounce" />
            <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase font-mono block">Streak status active</span>
            <p className="text-xs text-slate-300">
              Conquering scheduled blocks on your timeline reduces overall risk indexes. Keep consistent daily hours to secure peak coding performance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
