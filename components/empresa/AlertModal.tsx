'use client';

import React from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'info' | 'warning';
}

export default function AlertModal({ isOpen, onClose, title, message, type = 'error' }: AlertModalProps) {
  if (!isOpen) return null;

  const colors = {
    error: "bg-red-500/10 text-red-500",
    warning: "bg-amber-500/10 text-amber-500",
    info: "bg-blue-500/10 text-blue-400"
  };

  const icons = {
    error: "error",
    warning: "warning",
    info: "info"
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-[360px] bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          
          <div className={`w-16 h-16 rounded-full ${colors[type]} flex items-center justify-center mb-2`}>
            <span className="material-symbols-outlined text-4xl">{icons[type]}</span>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-normal break-words">
              {message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all text-sm cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
