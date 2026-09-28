"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, ChevronDown, Info, Settings, FileText, Code } from "lucide-react";

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium cursor-pointer transition-colors"
      >
        <User size={18} />
        <span>Profile</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#050A16] border border-white/10 rounded-xl shadow-xl py-2 z-50 animate-fade-in backdrop-blur-xl">
          <Link href="/about" className="flex items-center gap-3 px-4 py-2 text-sm text-[#8A93AD] hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsOpen(false)}>
            <Info size={16} /> About Team
          </Link>
          <Link href="/methods" className="flex items-center gap-3 px-4 py-2 text-sm text-[#8A93AD] hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsOpen(false)}>
            <Settings size={16} /> Methods
          </Link>
          <Link href="/dossier" className="flex items-center gap-3 px-4 py-2 text-sm text-[#8A93AD] hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsOpen(false)}>
            <FileText size={16} /> Dossier
          </Link>
          <Link href="/notebook" className="flex items-center gap-3 px-4 py-2 text-sm text-[#8A93AD] hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsOpen(false)}>
            <Code size={16} /> Notebook
          </Link>
        </div>
      )}
    </div>
  );
}
