"use client";

import * as React from "react";
import type { ToastActionElement } from "./toast";

// Shadcn's standard reducer-backed toast store — a module-level listener list rather than
// React context, so `toast()` can be called from anywhere (including outside a component,
// e.g. an API-client error handler) without threading a context through every call site.
interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
  open: boolean;
}

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

let memoryState: { toasts: ToasterToast[] } = { toasts: [] };
const listeners: Array<(state: typeof memoryState) => void> = [];
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function reducer(state: typeof memoryState, action: Action): typeof memoryState {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "DISMISS_TOAST":
      return { toasts: state.toasts.map((t) => (t.id === action.toastId || !action.toastId ? { ...t, open: false } : t)) };
    case "REMOVE_TOAST":
      return { toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [] };
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

export function toast(props: Omit<ToasterToast, "id" | "open">) {
  const id = crypto.randomUUID();
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true } });

  const timeout = setTimeout(() => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
    setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), 200);
  }, TOAST_REMOVE_DELAY);
  timeouts.set(id, timeout);

  return id;
}

export function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts: state.toasts,
    dismiss: (toastId?: string) => dispatch(toastId !== undefined ? { type: "DISMISS_TOAST", toastId } : { type: "DISMISS_TOAST" }),
  };
}
