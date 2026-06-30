import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Pin, Calendar } from "lucide-react";
import { Note } from "../types";

interface NotesDashboardProps {
  notes: Note[];
  onTogglePin: (noteId: string) => void;
  onOpenNewNote: () => void;
}

const colors = [
  { id: "white", bg: "bg-slate-800" },
  { id: "red", bg: "bg-red-900/40 border-red-500/30" },
  { id: "orange", bg: "bg-orange-900/40 border-orange-500/30" },
  { id: "green", bg: "bg-green-900/40 border-green-500/30" },
  { id: "blue", bg: "bg-blue-900/40 border-blue-500/30" },
  { id: "purple", bg: "bg-purple-900/40 border-purple-500/30" },
  { id: "pink", bg: "bg-pink-900/40 border-pink-500/30" },
  { id: "teal", bg: "bg-teal-900/40 border-teal-500/30" },
];

const NoteCard: React.FC<{ note: Note; onTogglePin: (id: string) => void }> = ({ note, onTogglePin }) => {
  const colorObj = colors.find(c => c.id === note.color) || colors[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative p-5 rounded-2xl border border-white/5 shadow-xl backdrop-blur-xl group overflow-hidden ${colorObj.bg}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/10 text-white/80">
          {note.type}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
          className={`p-1.5 rounded-full transition-colors ${note.isPinned ? "bg-white/20 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"}`}
        >
          <Pin className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed line-clamp-6">
        {note.content}
      </p>
      <div className="mt-4 flex items-center text-xs text-white/40 gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(note.createdAt).toLocaleDateString()}
      </div>
    </motion.div>
  );
};

export default function NotesDashboardView({ notes, onTogglePin, onOpenNewNote }: NotesDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColor, setFilterColor] = useState<string | null>(null);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = filterColor ? n.color === filterColor : true;
    return matchesSearch && matchesColor;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Smart Notes</h1>
          <p className="text-slate-400">Capture, organize, and find ideas instantly.</p>
        </div>
        <button
          onClick={onOpenNewNote}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setFilterColor(null)}
            className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all ${filterColor === null ? 'border-white' : 'border-transparent hover:border-white/50'} bg-slate-800`}
          />
          {colors.slice(1).map(c => (
            <button
              key={c.id}
              onClick={() => setFilterColor(filterColor === c.id ? null : c.id)}
              className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all ${filterColor === c.id ? 'border-white' : 'border-transparent hover:border-white/50'} ${c.bg.split(' ')[0]}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[500px]">
        {pinnedNotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 px-2">Pinned</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {pinnedNotes.map(note => <NoteCard key={note.id} note={note} onTogglePin={onTogglePin} />)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {unpinnedNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 px-2">Others</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {unpinnedNotes.map(note => <NoteCard key={note.id} note={note} onTogglePin={onTogglePin} />)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Plus className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notes yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto">Create your first smart note to capture ideas, tasks, or reminders instantly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
