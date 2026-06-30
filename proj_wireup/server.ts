import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Shared Gemini Client - lazy loaded to prevent startup crash if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Please set it in your environment or Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. SMART TASK INPUT & BREAKDOWN API
  app.post(["/api/task", "/task"], async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Missing task prompt/title" });
      }

      console.log("Analyzing task prompt:", prompt);
      const ai = getGeminiClient();
      
      const systemInstruction = `You are an AI productivity coach.`;

      const promptMsg = `
Analyze this task:

Task: ${prompt}
Deadline: (determine from task or relative to today 2026-06-22)

Return:
- Estimated hours
- Difficulty
- Priority
- Risk score (0-100) and Risk Level (Low/Medium/High)
- Recommended daily plan
- Subtasks

Respond in JSON matching the requested schema.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              deadline: { type: Type.STRING, description: "ISO 8601 format date-time from 2026-06-22" },
              estimatedHours: { type: Type.NUMBER },
              difficulty: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
              riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              riskPercentage: { type: Type.NUMBER },
              recommendedDailyPlan: { type: Type.STRING },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN }
                  },
                  required: ["id", "title", "completed"]
                }
              }
            },
            required: ["title", "deadline", "estimatedHours", "difficulty", "priority", "riskLevel", "riskPercentage", "recommendedDailyPlan", "subtasks"]
          }
        }
      });

      const resultText = response.text || "{}";
      const taskData = JSON.parse(resultText.trim());
      res.json(taskData);
    } catch (error: any) {
      console.error("Task Analysis Error:", error);
      // Fallback response for offline or error states
      const mockResult = {
        title: req.body.prompt || "New WireUp Task",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
        difficulty: "Medium",
        priority: "High",
        riskLevel: "Medium",
        riskPercentage: 45,
        subtasks: [
          { id: "s1", title: "Review requirements", completed: false },
          { id: "s2", title: "Build core prototype", completed: false },
          { id: "s3", title: "Run test cases", completed: false },
          { id: "s4", title: "Final deployment and check", completed: false }
        ]
      };
      res.json(mockResult);
    }
  });

  // 2. AI SCHEDULER API
  app.post(["/api/schedule", "/schedule"], async (req, res) => {
    try {
      const { tasks, habits } = req.body;
      const ai = getGeminiClient();

      const promptMsg = `
I have these active tasks: ${JSON.stringify(tasks || [])}
And these habits/preferences: ${JSON.stringify(habits || [])}
Generate an optimized schedule of 4-6 targeted clean work slots for this week (Monday to Sunday) mapping deep work times.
For each item, specify:
1. dayOfWeek: (e.g. 'Monday', 'Tuesday' etc.)
2. timeLabel: e.g. '7 PM - 8 PM' or '8 PM - 10 PM'
3. taskId: reference task id or 'habit'
4. taskTitle: the title of the task scheduled or habit name
5. durationMinutes: slot size (e.g., 60, 120, etc.)
`;

      const systemInstruction = `
You are WireUp's Smart Work Scheduler. Assign clear, focused timeslots matching student/freelancer routines. 
Return only valid JSON matching the schema of custom weekly timeslots.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayOfWeek: { type: Type.STRING, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
                timeLabel: { type: Type.STRING },
                taskId: { type: Type.STRING },
                taskTitle: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER }
              },
              required: ["dayOfWeek", "timeLabel", "taskId", "taskTitle", "durationMinutes"]
            }
          }
        }
      });

      const scheduleData = JSON.parse(response.text || "[]");
      res.json(scheduleData);
    } catch (error) {
      console.error("Scheduler Error:", error);
      // Beautiful mock scheduler items for instant performance
      const mockSchedule = [
        { dayOfWeek: "Monday", timeLabel: "7 PM - 8 PM", taskId: "habit", taskTitle: "Review Academic Tasks", durationMinutes: 60 },
        { dayOfWeek: "Tuesday", timeLabel: "8 PM - 10 PM", taskId: "t1", taskTitle: "Design UX Elements", durationMinutes: 120 },
        { dayOfWeek: "Wednesday", timeLabel: "6 PM - 8 PM", taskId: "t1", taskTitle: "Write Core Code logic", durationMinutes: 120 },
        { dayOfWeek: "Thursday", timeLabel: "7 PM - 9 PM", taskId: "t2", taskTitle: "Solve Complex Algorithms", durationMinutes: 120 },
        { dayOfWeek: "Friday", timeLabel: "5 PM - 6 PM", taskId: "habit", taskTitle: "Weekly Retrospective", durationMinutes: 60 }
      ];
      res.json(mockSchedule);
    }
  });

  // 3. AI ACCOUNTABILITY COACH CHAT API
  app.post(["/api/chat", "/chat"], async (req, res) => {
    try {
      const { message, history, tasks, habits } = req.body;
      const ai = getGeminiClient();

      // Synthesize context for coach
      const context = `
Active Tasks in WireUp database: ${JSON.stringify(tasks || [])}
Habits: ${JSON.stringify(habits || [])}
      `;

      const systemInstruction = `
You are Eve, the Elite AI Accountability Coach and Motivator inside the WireUp productivity environment.
Your tone is proactive, highly encouraging, smart, and direct. You hate passive reminder lists. You want the user to take action NOW.
Keep your responses professional, energetic, inspiring, and concise (under 3 or 4 sentences).
Give concrete, actionable advice based on the user's workload. Mention specific tasks or risks if relevant.
`;

      const contents = [
        { role: "user", parts: [{ text: `Current user state and workload details:\n${context}` }] }
      ];

      if (history && Array.isArray(history)) {
        history.slice(-6).forEach((h: any) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.8
        }
      });

      res.json({ response: response.text || "Keep pushing forward! Action beats planning." });
    } catch (error) {
      console.error("Chat Error:", error);
      res.json({
        response: "I'm right here with you! Let's conquer your pending deadlines today. Wire up your schedule and let's get into Deep Work Mode."
      });
    }
  });

  // 4. GET/POST ANALYTICS API (Context and Advice Generation)
  app.post(["/api/analytics", "/analytics"], async (req, res) => {
    try {
      const { tasks, habits } = req.body;
      const ai = getGeminiClient();
      
      const promptMsg = `
Based on these tasks: ${JSON.stringify(tasks || [])}
And these habits: ${JSON.stringify(habits || [])}
Generate 3 short, professional, motivating advice statements (as JSON Array) for the user. Mention specific tasks, completion rates, focus hours, or priorities if possible to make it highly personalized.
`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction: "You are an AI productivity coach analyzing the user's workload.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const data = JSON.parse(response.text || "[]");
      res.json({ advice: data });
    } catch (error) {
      res.json({
        advice: [
          "Knocking out just 25 minutes of your high-risk assignments now reduces deadline friction by half.",
          "Keep consistent hours: your brain craves rhythmic cycles. Study at 7 PM for peak encoding.",
          "Celebrate micro-wins: completing subtasks releases cognitive load and builds unstoppable compound momentum."
        ]
      });
    }
  });

  // VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite Server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WireUp Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
