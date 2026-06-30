import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Sparkles, BrainCircuit } from "lucide-react";

interface AITaskBreakdownProps {
  taskTitle: string;
}

export default function AITaskBreakdown({ taskTitle }: AITaskBreakdownProps) {
  const [steps, setSteps] = useState([
    { id: 1, text: `Analyze context for ${taskTitle}`, completed: false },
    { id: 2, text: "Draft core structure", completed: false },
    { id: 3, text: "Refine and iterate details", completed: false },
    { id: 4, text: "Final review & validation", completed: false },
  ]);

  const [activeStepId, setActiveStepId] = useState(1);
  const [allCompleted, setAllCompleted] = useState(false);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  useEffect(() => {
    // Determine the active step (first uncompleted step)
    const firstUncompleted = steps.find((s) => !s.completed);
    if (firstUncompleted) {
      setActiveStepId(firstUncompleted.id);
      setAllCompleted(false);
    } else {
      setActiveStepId(-1);
      setAllCompleted(true);
    }
  }, [steps]);

  const toggleStep = (id: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, completed: !step.completed } : step
      )
    );
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="flex justify-between items-center relative z-10">
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          AI Step Breakdown
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400">
            {completedCount}/{steps.length}
          </span>
          <span className="text-xs font-bold text-indigo-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {allCompleted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-6 flex flex-col items-center justify-center text-center gap-3 relative z-10"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-emerald-400">
              Task completed successfully 🎉
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 relative z-10"
          >
            {steps.map((step, index) => {
              const isActive = step.id === activeStepId;
              
              return (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col gap-2 p-3 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : step.completed
                      ? "bg-white/5 border-white/5 opacity-50"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 shrink-0 ${
                        step.completed
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "border-slate-500 hover:border-indigo-400 bg-transparent"
                      }`}
                    >
                      <AnimatePresence>
                        {step.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <Check className="w-3 h-3" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    <span
                      className={`text-sm transition-all duration-300 ${
                        step.completed
                          ? "text-slate-500 line-through"
                          : isActive
                          ? "text-indigo-200 font-medium"
                          : "text-slate-300"
                      }`}
                    >
                      {step.text}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 bg-black/20 rounded-xl p-3 border border-white/5 relative z-10">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Why these steps?
        </h5>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
          <li>Reduces complexity</li>
          <li>Improves focus</li>
          <li>Accelerates completion</li>
        </ul>
      </div>
    </div>
  );
}
