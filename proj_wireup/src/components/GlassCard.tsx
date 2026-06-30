import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function GlassCard({ children, className = "", id }: GlassCardProps) {
  const hasPadding = className.includes("p-") || className.includes("px-") || className.includes("py-");
  return (
    <div
      id={id}
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl ${hasPadding ? "" : "p-6"} transition-all duration-300 hover:border-white/20 relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}
