import React, { useState } from "react";
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  LayoutDashboard, 
  Sparkles,
  Target,
  StickyNote
} from "lucide-react";
import { motion } from "motion/react";

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Navigation({ currentTab, setCurrentTab }: NavigationProps) {
  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "add-task", name: "Tasks", icon: CheckSquare },
    { id: "notes", name: "Notes", icon: StickyNote },
    { id: "focus", name: "Focus Mode", icon: Target },
    { id: "calendar", name: "Calendar", icon: Calendar },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "chat", name: "AI Assistant", icon: Sparkles },
  ];

  return (
    <>
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 xl:left-8 xl:translate-x-0 z-50 flex flex-row items-center gap-4 w-max pb-[env(safe-area-inset-bottom)] pointer-events-none transform-gpu">
        {/* Floating Navigation Dock */}
        <div 
          className="backdrop-blur-xl border border-white/10 rounded-full px-1.5 py-1 flex items-center gap-0.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] navigation-dock pointer-events-auto will-change-transform transform-gpu"
          style={{ backgroundColor: '#14343f', WebkitBackdropFilter: 'blur(24px)' }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 outline-none hover:bg-white/10 group`}
                title={item.name}
              >
                {!isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-600 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${isActive ? "text-emerald-400 scale-110 -translate-y-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-slate-400 group-hover:text-slate-200 group-hover:-translate-y-0.5"}`} />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
