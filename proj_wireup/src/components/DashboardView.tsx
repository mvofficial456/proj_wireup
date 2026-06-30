import React, { useState } from "react";
import { Task, Schedule, Habit } from "../types";
import { Zap, Flame, Clock, Plus, CheckCircle, Info, Sparkles, AlertTriangle, Play, Search, ChevronLeft, ChevronRight, Target, TrendingUp, HelpCircle, X, Calendar, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import GlassCard from "./GlassCard";
import { motion, AnimatePresence } from "motion/react";
import AITaskBreakdown from "./AITaskBreakdown";

interface DashboardViewProps {
  tasks: Task[];
  schedules: Schedule[];
  habits: Habit[];
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: "Pending" | "In Progress" | "Completed" | "Missed") => void;
  onQuickTaskCreated: (taskData: any) => void;
  onActiveFocusTab: () => void;
}

export default function DashboardView({
  tasks,
  schedules,
  habits,
  onToggleSubtask,
  onUpdateTaskStatus,
  onQuickTaskCreated,
  onActiveFocusTab,
}: DashboardViewProps) {
  const [quickInput, setQuickInput] = useState("");
  const [loadingQuick, setLoadingQuick] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [direction, setDirection] = useState(0);

  // New states for Intelligent Task Prioritization
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [aiReordered, setAiReordered] = useState(false);
  const [selectedExplanationTask, setSelectedExplanationTask] = useState<Task | null>(null);
  const [isScoreMinimized, setIsScoreMinimized] = useState(false);
  const [isFocusMinimized, setIsFocusMinimized] = useState(false);
  const [isActionPlanMinimized, setIsActionPlanMinimized] = useState(false);

  // Generate current week dates (Mon-Sun)
  const weekDates = React.useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + (weekOffset * 7));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    return week;
  }, [weekOffset]);

  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const dateStr = new Date(task.deadline).toISOString().split('T')[0];
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(task);
    });
    return map;
  }, [tasks]);

  const displayTasks = React.useMemo(() => tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const taskDateStr = new Date(task.deadline).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    let matchesDate = taskDateStr === selectedDate;
    
    // Pull overdue tasks into Today's view, but once completed, they return to their original day.
    if (selectedDate === todayStr && taskDateStr < todayStr && task.status !== "Completed") {
      matchesDate = true;
    }
    
    return matchesSearch && matchesDate;
  }), [tasks, searchQuery, selectedDate]);

  const sortedDisplayTasks = React.useMemo(() => {
    let sorted = [...displayTasks];
    if (aiReordered) {
      const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      sorted.sort((a, b) => {
        const scoreA = (priorityWeight[a.priority] * 10) + ((a.riskPercentage || 0) * 0.5);
        const scoreB = (priorityWeight[b.priority] * 10) + ((b.riskPercentage || 0) * 0.5);
        return scoreB - scoreA;
      });
    }
    return sorted;
  }, [displayTasks, aiReordered]);

  const handleMagicPrioritize = () => {
    setIsPrioritizing(true);
    setTimeout(() => {
      setAiReordered(true);
      setIsPrioritizing(false);
      setTimeout(() => setAiReordered(false), 5000); // Revert or hide glow after some time if needed, actually let's keep it reordered.
    }, 1500);
  };

  // Focus Task: find highest priority, highest risk pending task
  const topFocusTasks = React.useMemo(() => 
    sortedDisplayTasks.filter((t) => t.status !== "Completed").slice(0, 3)
  , [sortedDisplayTasks]);

  // Deadline countdown tracker helper
  const getDaysLeft = React.useCallback((deadlineStr: string): number => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);

  const handleQuickWireUp = async () => {
    if (!quickInput.trim()) return;
    setLoadingQuick(true);
    try {
      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: quickInput }),
      });
      const data = await response.json();

      const taskToSave = {
        title: data.title || quickInput,
        deadline: data.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: data.estimatedHours || 4,
        completedHours: 0,
        difficulty: data.difficulty || "Medium",
        priority: data.priority || "High",
        status: "Pending",
        riskLevel: data.riskLevel || "Medium",
        riskPercentage: data.riskPercentage || 45,
        subtasks: data.subtasks ? data.subtasks.map((s: any, idx: number) => ({
          id: `qsub_${Date.now()}_${idx}`,
          title: s.title,
          completed: false,
        })) : [],
      };

      onQuickTaskCreated(taskToSave);
      setQuickInput("");
      alert("Successfully parsed task and integrated into database!");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingQuick(false);
    }
  };

  // Calculations for Deadline Risk Matrix and Productivity Score
  const {
    highRiskCount,
    mediumRiskCount,
    overallRiskScore,
    totalTasksToday,
    completedTasksToday,
    overdueTasksToday,
    highPriorityTasksToday,
    totalEstimatedHoursToday,
    timeRemainingToday,
    productivityScore,
  } = React.useMemo(() => {
    const highRisk = displayTasks.filter((t) => t.status !== "Completed" && t.riskLevel === "High").length;
    const mediumRisk = displayTasks.filter((t) => t.status !== "Completed" && t.riskLevel === "Medium").length;
    const overallRisk = displayTasks.length > 0 
      ? Math.round(displayTasks.reduce((sum, t) => sum + (t.status !== "Completed" ? (t.riskPercentage || 0) : 0), 0) / displayTasks.length) 
      : 15;

    const totalTasks = displayTasks.length;
    const completedTasks = displayTasks.filter(t => t.status === "Completed").length;
    const overdueTasks = displayTasks.filter(t => t.status !== "Completed" && new Date(t.deadline).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)).length;
    const highPriorityTasks = displayTasks.filter(t => t.status !== "Completed" && (t.priority === "Critical" || t.priority === "High")).length;
    const totalEstHours = displayTasks.reduce((sum, t) => sum + (t.status !== "Completed" ? (t.estimatedHours || 1) : 0), 0);
    const timeRemaining = Math.max(0, 12 - totalEstHours);

    let score = 0;
    if (totalTasks === 0) {
      score = 100;
    } else {
      const completionRatio = completedTasks / totalTasks;
      const taskCompletionPoints = completionRatio * 35;
      const scheduleBalancePoints = (totalEstHours <= 8) ? 25 : Math.max(0, 25 - (totalEstHours - 8) * 5);
      const deadlinePoints = overdueTasks > 0 ? 0 : 20;
      const consistencyPoints = 20;

      score = Math.round(taskCompletionPoints + scheduleBalancePoints + deadlinePoints + consistencyPoints);
    }

    return {
      highRiskCount: highRisk,
      mediumRiskCount: mediumRisk,
      overallRiskScore: overallRisk,
      totalTasksToday: totalTasks,
      completedTasksToday: completedTasks,
      overdueTasksToday: overdueTasks,
      highPriorityTasksToday: highPriorityTasks,
      totalEstimatedHoursToday: totalEstHours,
      timeRemainingToday: timeRemaining,
      productivityScore: score,
    };
  }, [displayTasks, getDaysLeft]);

  let scoreColorClass = "text-emerald-400";
  let scoreStroke = "#34d399";
  let scoreGradient = "from-emerald-500/10 to-emerald-900/10 border-emerald-500/20";
  let scoreGlow = "shadow-[0_0_40px_rgba(52,211,153,0.15)]";

  if (productivityScore >= 90) {
    scoreColorClass = "text-emerald-400";
    scoreStroke = "#34d399";
    scoreGradient = "from-emerald-500/10 to-emerald-900/10 border-emerald-500/20";
    scoreGlow = "shadow-[0_0_40px_rgba(52,211,153,0.15)]";
  } else if (productivityScore >= 70) {
    scoreColorClass = "text-blue-400";
    scoreStroke = "#60a5fa";
    scoreGradient = "from-blue-500/10 to-blue-900/10 border-blue-500/20";
    scoreGlow = "shadow-[0_0_40px_rgba(96,165,250,0.15)]";
  } else if (productivityScore >= 50) {
    scoreColorClass = "text-orange-400";
    scoreStroke = "#fb923c";
    scoreGradient = "from-orange-500/10 to-orange-900/10 border-orange-500/20";
    scoreGlow = "shadow-[0_0_40px_rgba(251,146,60,0.15)]";
  } else {
    scoreColorClass = "text-red-400";
    scoreStroke = "#f87171";
    scoreGradient = "from-red-500/10 to-red-900/10 border-red-500/20";
    scoreGlow = "shadow-[0_0_40px_rgba(248,113,113,0.15)]";
  }

  const criticalAlertTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "Completed") return false;
      const msLeft = new Date(t.deadline).getTime() - Date.now();
      return msLeft > 0 && msLeft <= 24 * 60 * 60 * 1000;
    });
  }, [tasks]);

  const maxHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const currentStreak = maxHabitStreak || 1;

  return (
    <div className="space-y-6 w-full">
      {criticalAlertTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-red-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <div className="flex items-start gap-3">
            <div className="bg-red-500/20 p-2 rounded-xl text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-red-400 font-bold text-sm sm:text-base">Critical Alert: Imminent Deadlines</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                You have {criticalAlertTasks.length} task{criticalAlertTasks.length !== 1 ? 's' : ''} due within the next 24 hours. Focus recommended.
              </p>
            </div>
          </div>
          <button 
            onClick={onActiveFocusTab}
            className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0 shadow-lg shadow-red-500/20"
          >
            Start Focus Session
          </button>
        </motion.div>
      )}

      {/* Dashboard Header: Greeting, Search, and Day Navigation */}
      <div className="flex flex-col space-y-6 w-full mb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="WireUp Logo" className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/10 shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "Good Morning";
                  if (hour < 18) return "Good Afternoon";
                  return "Good Evening";
                })()} • WireUp 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} • Here is your daily productivity overview.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-2.5 rounded-xl shrink-0 shadow-lg shadow-orange-500/5">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-bold text-sm">{currentStreak} Day Streak</span>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Day Navigation Bar */}
        <div className="flex items-center gap-1 sm:gap-2 w-full">
          <button
            onClick={() => {
              setDirection(-1);
              setWeekOffset(o => o - 1);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all focus:outline-none flex-shrink-0 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
          
          <div className="flex-1 w-full overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transform-gpu" style={{ WebkitOverflowScrolling: "touch" }}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div 
                key={weekOffset}
                custom={direction}
                initial={(dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 })}
                animate={{ x: 0, opacity: 1 }}
                exit={(dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0 })}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center gap-1.5 sm:gap-2 min-w-max"
              >
                {weekDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isActive = dateStr === selectedDate;
                  
                  const dayTasks = tasksByDate.get(dateStr) || [];
                  const completedCount = dayTasks.filter(t => t.status === "Completed").length;
                  const pendingCount = dayTasks.filter(t => t.status === "Pending" || t.status === "In Progress").length;
                  const overdueCount = dayTasks.filter(t => t.status === "Missed" || (t.status !== "Completed" && new Date(t.deadline) < new Date())).length;
                  const totalTasks = dayTasks.length;
                  const activeDisplayCount = pendingCount + (dayTasks.some(t => t.status === "Missed" || (t.status !== "Completed" && new Date(t.deadline) < new Date())) ? overdueCount : 0);
                  // simpler activeDisplayCount: just all incomplete tasks
                  const incompleteCount = dayTasks.filter(t => t.status !== "Completed").length;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative flex flex-col items-center justify-center py-2 px-1 sm:px-2 rounded-xl transition-all duration-300 select-none group focus:outline-none ${
                        isActive 
                          ? "bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105 border border-white/10 min-w-[55px] sm:min-w-[65px]" 
                          : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 min-w-[50px] sm:min-w-[60px]"
                      }`}
                    >
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-100" : "text-slate-400 group-hover:text-slate-300"}`}>
                        {isToday && weekOffset === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      
                      <span className={`text-lg sm:text-xl font-black mt-0.5 mb-0.5 ${isActive ? "text-white" : "text-slate-200 group-hover:text-white"}`}>
                        {date.getDate()}
                      </span>
                      
                      {isActive && incompleteCount > 0 ? (
                        <span className="text-[9px] font-medium text-indigo-100 bg-white/20 px-1.5 py-0.5 rounded-full mt-0.5 backdrop-blur-sm whitespace-nowrap leading-none">
                          {incompleteCount}
                        </span>
                      ) : isActive && incompleteCount === 0 ? (
                         <span className="text-[9px] font-medium text-indigo-200/50 mt-0.5 whitespace-nowrap leading-none">
                          -
                        </span>
                      ) : (
                        <div className="flex gap-0.5 mt-1 h-1 items-center justify-center">
                          {completedCount > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                          {pendingCount > 0 && <div className="w-1 h-1 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                          {overdueCount > 0 && <div className="w-1 h-1 rounded-full bg-rose-400/80 shadow-[0_0_8px_rgba(244,63,114,0.5)]" />}
                          {totalTasks === 0 && <div className="w-1 h-1 rounded-full bg-transparent" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <button
            onClick={() => {
              setDirection(1);
              setWeekOffset(o => o + 1);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all focus:outline-none flex-shrink-0 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* PRODUCTIVITY SCORE CARD */}
      <div 
        className={`bg-gradient-to-br ${scoreGradient} backdrop-blur-xl border rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-center md:items-stretch gap-4 sm:gap-6 relative overflow-hidden ${scoreGlow} transition-all duration-500`}
      >
        <button
          onClick={() => setIsScoreMinimized(!isScoreMinimized)}
          className="absolute top-3 right-3 p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-slate-400 hover:text-white shrink-0 z-10"
        >
          {isScoreMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>

        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="transparent" />
              <motion.circle
                initial={{ strokeDashoffset: 351.85 }}
                animate={{ strokeDashoffset: 351.85 - (351.85 * productivityScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="64"
                cy="64"
                r="56"
                stroke={scoreStroke}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="351.85"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-extrabold ${scoreColorClass}`}>{productivityScore}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">/ 100</span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-2">Productivity Score</span>
        </div>

        {!isScoreMinimized && (
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-4 text-center md:text-left mt-3 md:mt-0">
            {productivityScore >= 90 ? (
              <p className="text-base font-bold text-white mb-0.5">Incredible focus today! 🔥</p>
            ) : productivityScore >= 70 ? (
              <p className="text-base font-bold text-white mb-0.5">You are on track to complete most of your work. ✨</p>
            ) : productivityScore >= 50 ? (
              <p className="text-base font-bold text-white mb-0.5">A bit behind, but there's still time to catch up. ⚡</p>
            ) : (
              <p className="text-base font-bold text-white mb-0.5">Today is tough. Focus on high priority tasks. 🎯</p>
            )}
            
            {topFocusTasks.length > 0 && (
              <p className="text-xs text-slate-400">
                Completing <span className="font-semibold text-indigo-300">"{topFocusTasks[0].title}"</span> can increase your score by 15 points.
              </p>
            )}
            {topFocusTasks.length === 0 && productivityScore < 100 && (
              <p className="text-xs text-slate-400">
                Wire up a new task to boost your score!
              </p>
            )}
          </div>

          {/* Productivity Factors Mini Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> Tasks
              </span>
              <span className="text-base font-bold text-white">{completedTasksToday}<span className="text-slate-500 text-xs">/{totalTasksToday}</span></span>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-2.5 h-2.5 text-blue-400" /> Time Left
              </span>
              <span className="text-base font-bold text-white">{timeRemainingToday}h</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Flame className="w-2.5 h-2.5 text-orange-400" /> High Priority
              </span>
              <span className="text-base font-bold text-white">{highPriorityTasksToday}</span>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <AlertTriangle className={`w-2.5 h-2.5 ${overdueTasksToday > 0 ? "text-red-400" : "text-slate-400"}`} /> Overdue
              </span>
              <span className={`text-base font-bold ${overdueTasksToday > 0 ? "text-red-400" : "text-white"}`}>{overdueTasksToday}</span>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3.5 items-start">
            <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">AI Coach Insight</h4>
              <p className="text-sm text-slate-200 leading-relaxed mb-3">
                {productivityScore >= 90 ? "Your score is excellent because you're staying ahead of deadlines and balancing your workload well." : 
                 productivityScore >= 70 ? "You have a solid pace today. Completing your pending tasks will push you into the green." : 
                 productivityScore >= 50 ? "Your score reflects a heavy workload with some tight deadlines. Let's regain control." : 
                 "Your score is low due to pending high-priority tasks and tight deadlines."}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                  Action Step
                </span>
                <span className="text-slate-300 font-medium">
                  {topFocusTasks.length > 0 
                    ? `Knock out "${topFocusTasks[0].title}" to build momentum.` 
                    : "Add a new small task to kickstart your productivity."}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* SECTION 1: AI FOCUS BENTO CARD */}
      <div className="bg-white/5 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 sm:p-6 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.15)] group w-full">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-x-1/4 translate-y-1/4 blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" /> Your Focus Today
            </h2>
            <p className="text-sm text-slate-400 mt-1">AI has analyzed your deadlines and priorities.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              AI Active
            </div>
            <button
              onClick={() => setIsFocusMinimized(!isFocusMinimized)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-slate-400 hover:text-white shrink-0"
              style={{ borderWidth: "0.8px", borderRadius: "10px" }}
            >
              {isFocusMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isFocusMinimized && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
          {topFocusTasks.length > 0 ? topFocusTasks.map((task) => {
            const isDueTomorrow = getDaysLeft(task.deadline) <= 1;
            const isHighImpact = task.priority === "Critical" || task.priority === "High";
            
            return (
              <div key={task.id} className="bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 transition-all rounded-2xl p-4 flex flex-col justify-between" style={{ borderWidth: '2.8px', borderRadius: '28px', width: '294.4px' }}>
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-sm sm:text-base font-bold text-white break-words line-clamp-2">{task.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-semibold text-slate-400 bg-black/20 px-2 py-1 rounded-md flex items-center justify-center gap-1.5" style={{ width: '98.4px', height: '34px', fontSize: '12px', fontWeight: 'normal', lineHeight: '17px', textAlign: 'center' }}>
                      <Clock className="w-3 h-3 shrink-0" /> {getDaysLeft(task.deadline) === 0 ? "Due Today" : `Due in ${getDaysLeft(task.deadline)}d`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex items-center justify-center gap-1.5 transition-colors duration-700 ${
                      (task.riskPercentage || 0) > 80 ? "bg-red-500/10 text-red-400" : (task.riskPercentage || 0) > 50 ? "bg-orange-500/10 text-orange-400" : "bg-emerald-500/10 text-emerald-400"
                    }`} style={{ width: '83.75px', height: '35px', fontSize: '12px' }}>
                      Risk: {task.riskPercentage || 0}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Progress</span>
                      <span>{task.completedHours || 0} / {task.estimatedHours || 1}h</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${Math.min(100, ((task.completedHours || 0) / Math.max(1, task.estimatedHours || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Explanation Badge */}
                  <div className="border-t border-white/5 pt-3 mt-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300">
                      {isDueTomorrow ? <Zap className="w-3.5 h-3.5" /> : isHighImpact ? <TrendingUp className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                      {isDueTomorrow ? "Approaching deadline" : isHighImpact ? "High impact" : "Important goal"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-between items-center border-t border-white/5" style={{ borderRadius: '13px', borderStyle: 'dashed', fontSize: '30px' }}>
                  <span className="text-[10px] text-slate-500 font-medium" style={{ fontSize: '17px', borderWidth: '0px', borderRadius: '10px', borderStyle: 'dashed' }}>Est: {task.estimatedHours || 1}h</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExplanationTask(task);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    style={{ width: '75.7625px', borderWidth: '2px', backgroundColor: '#9eb6c5', color: '#000000' }}
                  >
                    <HelpCircle className="w-3 h-3 shrink-0" /> Why?
                  </button>
                </div>
              </div>
            );
          }) : (
             <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
                <p className="text-sm font-bold text-slate-400">Workspace cleared!</p>
                <p className="text-xs text-slate-500 mt-1">No pending focus tasks for today.</p>
             </div>
          )}
        </div>
        )}
      </div>

      {/* SECTION 2 & 3: MAGIC PRIORITIZE BUTTON & MAIN TASK LIST */}
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" /> Action Plan
            </h3>
            {aiReordered && !isPrioritizing && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md">
                <CheckCircle className="w-3 h-3" /> AI Reorganized
              </motion.div>
            )}
            <button
              onClick={() => setIsActionPlanMinimized(!isActionPlanMinimized)}
              className="p-1.5 ml-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors text-slate-400 hover:text-white shrink-0"
            >
              {isActionPlanMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
          
          <button 
            onClick={handleMagicPrioritize}
            disabled={isPrioritizing || sortedDisplayTasks.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-full transition-all duration-300 hover:scale-105 group shadow-[0_0_15px_rgba(99,102,241,0.1)] focus:outline-none disabled:opacity-50 disabled:hover:scale-100"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${isPrioritizing ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-300">
              {isPrioritizing ? 'Analyzing...' : 'Re-Prioritize'}
            </span>
          </button>
        </div>

        {!isActionPlanMinimized && (
        <div className="flex flex-col space-y-3">
          <AnimatePresence>
            {sortedDisplayTasks.filter((t) => t.status !== "Completed").length > 0 ? (
              sortedDisplayTasks.filter((t) => t.status !== "Completed").map((task, index) => {
                const isCritical = task.priority === "Critical";
                const isHigh = task.priority === "High";
                const isMedium = task.priority === "Medium";
                
                const priorityColor = isCritical ? "text-red-400 border-red-500/20 bg-red-500/10" : 
                                     isHigh ? "text-orange-400 border-orange-500/20 bg-orange-500/10" : 
                                     isMedium ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" : 
                                     "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
                
                const aiLabel = isCritical ? "🔥 Do Now" : 
                               isHigh ? "⚡ Today" : 
                               isMedium ? "📅 Later" : "🌱 Optional";

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={task.id} 
                    onClick={() => setSelectedExplanationTask(task)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900/40 hover:bg-slate-900/60 transition-all border border-white/5 p-4 rounded-2xl cursor-pointer group/task relative overflow-hidden ${aiReordered && index < 3 ? 'shadow-[0_0_15px_rgba(99,102,241,0.1)] border-indigo-500/20' : ''}`}
                  >
                    {aiReordered && index < 3 && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border ${priorityColor}`}>
                           {aiLabel}
                         </span>
                         <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                           Score: {Math.round((task.priority === "Critical" ? 40 : task.priority === "High" ? 30 : task.priority === "Medium" ? 20 : 10) + (task.riskPercentage || 0) * 0.5)}
                         </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate pr-2">{task.title}</h4>
                      
                      {/* Progress Bar */}
                      <div className="mt-2.5 w-full max-w-sm space-y-1">
                        <div className="flex justify-between text-[9px] font-medium text-slate-400">
                          <span>Progress</span>
                          <span>{task.completedHours || 0} / {task.estimatedHours || 1}h</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${Math.min(100, ((task.completedHours || 0) / Math.max(1, task.estimatedHours || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[10px] sm:text-xs text-slate-500 font-mono uppercase font-semibold">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-50" /> Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        <span className={`flex items-center gap-1.5 transition-colors duration-700 ${Math.max(0, task.riskPercentage || 0) > 80 ? 'text-red-400' : Math.max(0, task.riskPercentage || 0) > 50 ? 'text-orange-400' : ''}`}><AlertTriangle className="w-3 h-3 opacity-50" /> Risk: {task.riskLevel}</span>
                        <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 opacity-50" /> Est: {task.estimatedHours || 1}h</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTaskStatus(task.id, "Completed");
                        }}
                        className="p-2 sm:p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all active:scale-95 border border-transparent hover:border-emerald-500/20"
                        title="Mark Completed"
                      >
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <CheckCircle className="w-8 h-8 text-emerald-500/50 mb-2" />
                <p className="text-sm text-slate-400 font-bold">No upcoming pending deadlines.</p>
                <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">Use the Smart Input Bar above to wire up your first task.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
        )}
      </div>

      {/* SECTION 4 & 5: AI EXPLANATION PANEL */}
      <AnimatePresence>
        {selectedExplanationTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedExplanationTask(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-10"
            >
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/90 backdrop-blur-md z-10 shrink-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" /> AI Insights
                </h3>
                <button 
                  onClick={() => setSelectedExplanationTask(null)}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 flex-1 flex flex-col gap-6 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Task Analyzed</h4>
                  <p className="text-lg sm:text-xl font-bold text-white leading-tight">{selectedExplanationTask.title}</p>
                </div>
                
                <div className="flex-1">
                  <AITaskBreakdown taskTitle={selectedExplanationTask.title} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
