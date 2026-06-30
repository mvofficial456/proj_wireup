export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  deadline: string; // ISO date-time or YYYY-MM-DD
  estimatedHours: number;
  completedHours?: number;
  difficulty: "Low" | "Medium" | "High";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "In Progress" | "Completed" | "Missed" | "todo" | "in_progress" | "completed" | "missed";
  riskScore?: number; // 0 to 100
  riskPercentage?: number; // 0 to 100
  riskLevel: "Low" | "Medium" | "High";
  recommendedDailyPlan?: string;
  subtasks: Subtask[];
  createdAt: string;
}

export interface Schedule {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday" | string;
  timeLabel: string; // e.g. "7:00 PM - 8:30 PM"
  durationMinutes: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string; // date string
}

export interface Analytics {
  userId: string;
  productivityScore: number;
  completedCount: number;
  missedCount: number;
  streakDays: number;
  weeklyProgress: {
    day: string; // "Mon", "Tue" ...
    completed: number;
    missed: number;
  }[];
}

export interface NotificationAlert {
  id: string;
  userId: string;
  content: string;
  type: "risk" | "info" | "success" | "recommendation";
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface Note {
  id: string;
  userId: string;
  content: string;
  color: string;
  isPinned: boolean;
  type: "Note" | "Task" | "Reminder";
  createdAt: string;
}
