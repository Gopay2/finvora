"use client";

import { useFormStatus } from "react-dom";
import React from "react";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
}

export default function SubmitButton({ 
  label, 
  loadingLabel = "Procesando...", 
  className = "w-full bg-secondary text-slate-950 font-bold py-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
