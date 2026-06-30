import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { Task, Schedule, Habit, NotificationAlert, Note } from "./types";

// View Imports
import AuthView from "./components/AuthView";
import Navigation from "./components/Navigation";
import DashboardView from "./components/DashboardView";
import AddTaskView from "./components/AddTaskView";
import AIPlannerView from "./components/AIPlannerView";
import CalendarView from "./components/CalendarView";
import AnalyticsView from "./components/AnalyticsView";
import AIChatView from "./components/AIChatView";
import FocusModeView from "./components/FocusModeView";
import NotesDashboardView from "./components/NotesDashboardView";
import SmartNotesModal from "./components/SmartNotesModal";

// High-fidelity preloads for onboarding removed

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Sync state pools
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Sync to database
  useEffect(() => {
    if (!currentUser) return;
    
    if (currentUser.uid === "guest_sandbox") {
      setTasks([]);
      setSchedules([]);
      setHabits([]);
      setNotes([]);
      return;
    }

    const fetchWorkspaceData = async () => {
      try {
        const uid = currentUser.uid;

        // Tasks
        const tSnap = await getDocs(collection(db, `users/${uid}/tasks`));
        let fetchedTasks: Task[] = [];
        tSnap.forEach(d => {
          fetchedTasks.push({ id: d.id, ...d.data() } as Task);
        });

        // Habits
        const hSnap = await getDocs(collection(db, `users/${uid}/habits`));
        let fetchedHabits: Habit[] = [];
        hSnap.forEach(d => {
          fetchedHabits.push({ id: d.id, ...d.data() } as Habit);
        });

        // Schedules
        const sSnap = await getDocs(collection(db, `users/${uid}/schedules`));
        let fetchedSchedules: Schedule[] = [];
        sSnap.forEach(d => {
          fetchedSchedules.push({ id: d.id, ...d.data() } as Schedule);
        });

        // Notes
        const nSnap = await getDocs(collection(db, `users/${uid}/notes`));
        let fetchedNotes: Note[] = [];
        nSnap.forEach(d => {
          fetchedNotes.push({ id: d.id, ...d.data() } as Note);
        });

        setTasks(fetchedTasks);
        setSchedules(fetchedSchedules);
        setHabits(fetchedHabits);
        setNotes(fetchedNotes);

      } catch (err) {
        console.warn("Firestore access error, loading safe local mock Sandbox state:", err);
        setTasks([]);
        setSchedules([]);
        setHabits([]);
        setNotes([]);
      }
    };

    fetchWorkspaceData();
  }, [currentUser]);

  // Removed suggestions load since DashboardView no longer uses it

  // Handle tasks created
  const handleSaveTask = useCallback(async (taskData: Omit<Task, "id" | "userId" | "createdAt">) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const newId = `task_${Math.random().toString(36).substring(5)}`;

    const newTask: Task = {
      id: newId,
      userId: uid,
      createdAt: new Date().toISOString(),
      ...taskData,
      completedHours: 0,
      riskPercentage: taskData.riskScore || 35
    };

    setTasks(prev => [newTask, ...prev]);

    if (uid !== "guest_sandbox") {
      try {
        await setDoc(doc(db, `users/${uid}/tasks`, newId), newTask);
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  // Toggle subtasks completion
  const handleToggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    setTasks(prevTasks => {
      const updated = prevTasks.map(t => {
        if (t.id === taskId) {
          const nextSubs = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
          const compCount = nextSubs.filter(s => s.completed).length;
          const total = nextSubs.length || 1;
          const pct = Math.round((compCount / total) * 100);
          const nextRisk = Math.max(10, 100 - pct);
          return {
            ...t,
            subtasks: nextSubs,
            riskPercentage: nextRisk,
            riskLevel: (nextRisk > 60 ? "High" : nextRisk > 35 ? "Medium" : "Low") as any
          };
        }
        return t;
      });
      
      const target = updated.find(t => t.id === taskId);
      if (target && uid !== "guest_sandbox") {
        updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
          subtasks: target.subtasks,
          riskPercentage: target.riskPercentage,
          riskLevel: target.riskLevel
        }).catch(console.error);
      }
      return updated;
    });
  }, [currentUser]);

  // Update status
  const handleUpdateTaskStatus = useCallback(async (taskId: string, status: "Pending" | "In Progress" | "Completed" | "Missed") => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    setTasks(prevTasks => {
      const updated = prevTasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            riskPercentage: status === "Completed" ? 0 : t.riskPercentage
          };
        }
        return t;
      });

      if (uid !== "guest_sandbox") {
        updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
          status,
          riskPercentage: status === "Completed" ? 0 : 45
        }).catch(console.error);
      }

      return updated;
    });
  }, [currentUser]);

  // Quick WireUp Task
  const handleQuickTaskCreated = useCallback(async (task: any) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const newId = `task_${Date.now()}`;
    const newTask: Task = {
      id: newId,
      userId: uid,
      createdAt: new Date().toISOString(),
      ...task
    };

    setTasks(prev => [newTask, ...prev]);

    if (uid !== "guest_sandbox") {
      try {
        await setDoc(doc(db, `users/${uid}/tasks`, newId), newTask);
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  const handleSaveNote = useCallback(async (noteData: Omit<Note, "id" | "userId" | "createdAt">) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const newId = `note_${Date.now()}`;
    const newNote: Note = {
      id: newId,
      userId: uid,
      createdAt: new Date().toISOString(),
      ...noteData
    };

    setNotes(prev => [newNote, ...prev]);

    if (uid !== "guest_sandbox") {
      try {
        await setDoc(doc(db, `users/${uid}/notes`, newId), newNote);
      } catch (e) {
        console.error(e);
      }
    }
  }, [currentUser]);

  const handleToggleNotePin = useCallback(async (noteId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    setNotes(prev => {
      const updated = prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
      const target = updated.find(n => n.id === noteId);
      
      if (target && uid !== "guest_sandbox") {
        updateDoc(doc(db, `users/${uid}/notes`, noteId), {
          isPinned: target.isPinned
        }).catch(console.error);
      }
      return updated;
    });
  }, [currentUser]);

  // Generate deep work planning blocks
  const handleGenerateSchedule = useCallback(async () => {
    if (!currentUser) return;
    setIsGeneratingPlan(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      });
      const data = await res.json();

      if (data && Array.isArray(data)) {
        const uid = currentUser.uid;
        const newSchedules: Schedule[] = data.map((item: any, idx: number) => ({
          id: `sch_${idx}_${Date.now()}`,
          userId: uid,
          taskId: item.taskId || "general",
          taskTitle: item.taskTitle || "AI Deep Focus Session",
          dayOfWeek: item.dayOfWeek || "Monday",
          timeLabel: item.timeLabel || "7 PM - 9 PM",
          durationMinutes: item.durationMinutes || 120,
          completed: false
        }));

        setSchedules(newSchedules);

        if (uid !== "guest_sandbox") {
          // Save collections to Firestore
          const snapshot = await getDocs(collection(db, `users/${uid}/schedules`));
          const batch = writeBatch(db);
          snapshot.forEach(docSnap => batch.delete(docSnap.ref));
          await batch.commit();

          const insertBatch = writeBatch(db);
          newSchedules.forEach(s => insertBatch.set(doc(db, `users/${uid}/schedules`, s.id), s));
          await insertBatch.commit();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [currentUser, tasks, habits]);

  // Toggle scheduler slot completion
  const handleToggleScheduleCompletion = useCallback(async (scheduleId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    setSchedules(prev => {
      const updated = prev.map(s => {
        if (s.id === scheduleId) {
          return { ...s, completed: !s.completed };
        }
        return s;
      });

      const target = updated.find(s => s.id === scheduleId);
      if (target && uid !== "guest_sandbox") {
        updateDoc(doc(db, `users/${uid}/schedules`, scheduleId), {
          completed: target.completed
        }).catch(console.error);
      }

      return updated;
    });
  }, [currentUser]);

  const handleRecoverSchedule = useCallback(async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    setIsGeneratingPlan(true);

    try {
      // 1. Identify all Missed tasks
      const missedTasks = tasks.filter(t => t.status === "Missed");
      if (missedTasks.length === 0) {
        alert("No missed tasks found to replan!");
        setIsGeneratingPlan(false);
        return;
      }

      // 2. Change them to Pending and push deadline forwards 2 days
      const updatedTasks = tasks.map(t => {
        if (t.status === "Missed") {
          const currentDeadline = new Date(t.deadline);
          currentDeadline.setDate(currentDeadline.getDate() + 2);
          return {
            ...t,
            status: "Pending" as const,
            deadline: currentDeadline.toISOString(),
            riskPercentage: 60, // Reset to medium/high risk
            riskLevel: "Medium" as const
          };
        }
        return t;
      });

      setTasks(updatedTasks);
      
      if (uid !== "guest_sandbox") {
        // Update in db
        const batch = writeBatch(db);
        updatedTasks.filter(t => t.status === "Pending" /* the updated ones */).forEach(t => {
           batch.update(doc(db, `users/${uid}/tasks`, t.id), {
             status: t.status,
             deadline: t.deadline,
             riskPercentage: 60,
             riskLevel: "Medium"
           });
        });
        await batch.commit();
      }

      // 3. Regnerate schedule
      await handleGenerateSchedule();

    } catch (error) {
      console.error("Recover schedule failure:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [currentUser, tasks, handleGenerateSchedule]);

  // Completing Pomodoro sessions updates stats
  const handleCompleteSession = useCallback(async (taskId: string, durationMinutes: number) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    // Trigger positive habit toggle
    setHabits(prev => prev.map(h => {
      if (h.title.toLowerCase().includes("deep work")) {
        return { ...h, completedToday: true, streak: h.streak + 1 };
      }
      return h;
    }));

    // If attached to a task, increment completed hours and adjust risk percentage!
    if (taskId && taskId !== "general") {
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(t => {
          if (t.id === taskId) {
            const prevCompleted = t.completedHours || 0;
            const targetHours = t.estimatedHours || 4;
            const nextHours = prevCompleted + Math.round((durationMinutes / 60) * 10) / 10;
            const pct = Math.min(100, Math.round((nextHours / targetHours) * 100));
            const nextRiskPercent = Math.max(10, 100 - pct);

            return {
              ...t,
              completedHours: nextHours,
              riskPercentage: nextRiskPercent,
              riskLevel: (nextRiskPercent > 60 ? "High" : nextRiskPercent > 35 ? "Medium" : "Low") as any,
              status: pct >= 100 ? ("Completed" as const) : t.status
            };
          }
          return t;
        });

        const target = updatedTasks.find(t => t.id === taskId);
        if (target && uid !== "guest_sandbox") {
          updateDoc(doc(db, `users/${uid}/tasks`, taskId), {
            completedHours: target.completedHours,
            riskPercentage: target.riskPercentage,
            riskLevel: target.riskLevel,
            status: target.status
          }).catch(console.error);
        }

        return updatedTasks;
      });
    }
  }, [currentUser]);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
  }, []);

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView 
            tasks={tasks}
            schedules={schedules}
            habits={habits}
            onToggleSubtask={handleToggleSubtask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onQuickTaskCreated={handleQuickTaskCreated}
            onActiveFocusTab={() => setCurrentTab("focus")}
          />
        );
      case "add-task":
        return <AddTaskView onSaveTask={handleSaveTask} />;
      case "planner":
        return (
          <AIPlannerView 
            tasks={tasks}
            habits={habits}
            schedules={schedules}
            onGenerateSchedule={handleGenerateSchedule}
            onToggleScheduleSlot={handleToggleScheduleCompletion}
            onRecoverSchedule={handleRecoverSchedule}
            isGeneratingPlan={isGeneratingPlan}
          />
        );
      case "calendar":
        return <CalendarView tasks={tasks} schedules={schedules} />;
      case "analytics":
        return <AnalyticsView tasks={tasks} habits={habits} />;
      case "chat":
        return <AIChatView tasks={tasks} habits={habits} />;
      case "focus":
        return <FocusModeView tasks={tasks} onCompleteSession={handleCompleteSession} />;
      case "notes":
        return <NotesDashboardView notes={notes} onTogglePin={handleToggleNotePin} onOpenNewNote={() => setIsNotesModalOpen(true)} />;
      default:
        return <p>Active tab unspecified.</p>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono tracking-wider">Syncing WireUp Database Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="h-full bg-[#030712] text-gray-100 flex flex-col font-sans w-full overflow-hidden relative">
      <Navigation 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      <main 
        className="flex-1 h-full min-w-0 p-4 pt-8 pb-32 md:pb-28 overflow-y-auto overflow-x-hidden transform-gpu" 
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="w-full h-full max-w-full">
          {renderTabContent()}
        </div>
      </main>

      <SmartNotesModal 
        isOpen={isNotesModalOpen} 
        onClose={() => setIsNotesModalOpen(false)} 
        onSave={handleSaveNote} 
      />
    </div>
  );
}
