"use client";

import { useFormStatus } from "react-dom";
import React from "react";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}

export default function SubmitButton({ children, pendingText = "Procesando...", className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
