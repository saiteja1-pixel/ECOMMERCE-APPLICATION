"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SlideOverPanel({ isOpen, onClose, title, children }: SlideOverPanelProps) {
  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-lg bg-card border-l border-border shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-foreground truncate">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
}
