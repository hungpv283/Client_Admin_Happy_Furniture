"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles: Record<ToastType, string> = {
  success: "bg-white dark:bg-gray-800 border-l-4 border-green-500 text-green-700 dark:text-green-400",
  error:   "bg-white dark:bg-gray-800 border-l-4 border-red-500 text-red-700 dark:text-red-400",
  warning: "bg-white dark:bg-gray-800 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400",
  info:    "bg-white dark:bg-gray-800 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400",
};

const progressStyles: Record<ToastType, string> = {
  success: "bg-green-500",
  error:   "bg-red-500",
  warning: "bg-yellow-500",
  info:    "bg-blue-500",
};

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const duration = item.duration ?? 3500;
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleClose();
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 ${styles[item.type]} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
      style={{ minWidth: 280, maxWidth: 380 }}
    >
      <div className="flex items-start gap-3 px-4 py-3 pr-10">
        <span className="mt-0.5">{icons[item.type]}</span>
        <p className="text-sm font-medium leading-snug">{item.message}</p>
      </div>
      {/* Close btn */}
      <button
        onClick={handleClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {/* Progress bar */}
      <div className="h-1 w-full bg-black/10 dark:bg-white/10">
        <div
          className={`h-full transition-none ${progressStyles[item.type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast("success", msg),
    error:   (msg) => toast("error", msg),
    warning: (msg) => toast("warning", msg),
    info:    (msg) => toast("info", msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Portal-like fixed container */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItem item={item} onClose={() => remove(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
