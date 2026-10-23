"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ShortcutAction =
  | "openSearch"
  | "openNewUrl"
  | "openNewPackage"
  | "openNewNote"
  | "openNewTask";

export interface ShortcutBinding {
  key: string; // e.g. "k", "n", "p", "j", "t"
  ctrlOrCmd: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  description: string;
}

export type ShortcutConfig = Record<ShortcutAction, ShortcutBinding>;

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  openSearch: {
    key: "k",
    ctrlOrCmd: true,
    label: "Quick Search",
    description: "Open the global search and command palette",
  },
  openNewUrl: {
    key: "n",
    ctrlOrCmd: true,
    label: "New Bookmark / URL",
    description: "Open the dialog to save a new bookmark",
  },
  openNewPackage: {
    key: "p",
    ctrlOrCmd: true,
    label: "New Package",
    description: "Create a new top-level package or folder",
  },
  openNewNote: {
    key: "j",
    ctrlOrCmd: true,
    label: "New Note",
    description: "Create a new note attached to a bookmark",
  },
  openNewTask: {
    key: "t",
    ctrlOrCmd: true,
    label: "New Task",
    description: "Create a new task with priority and due date",
  },
};

const STORAGE_KEY = "linknest_custom_shortcuts_v1";

interface ShortcutContextValue {
  shortcuts: ShortcutConfig;
  updateShortcut: (action: ShortcutAction, binding: Partial<ShortcutBinding>) => void;
  resetShortcuts: () => void;
  formatBinding: (binding: ShortcutBinding) => string;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setShortcuts({ ...DEFAULT_SHORTCUTS, ...parsed });
        }
      } catch {
        // Ignore parse error and keep defaults
      }
    }
  }, []);

  function updateShortcut(action: ShortcutAction, binding: Partial<ShortcutBinding>) {
    setShortcuts((prev) => {
      const updated = {
        ...prev,
        [action]: {
          ...prev[action],
          ...binding,
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage might be restricted
      }
      return updated;
    });
  }

  function resetShortcuts() {
    setShortcuts(DEFAULT_SHORTCUTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage might be restricted
    }
  }

  function formatBinding(binding: ShortcutBinding): string {
    const parts: string[] = [];
    if (binding.ctrlOrCmd) {
      parts.push(isMac ? "⌘" : "Ctrl");
    }
    if (binding.alt) {
      parts.push(isMac ? "⌥" : "Alt");
    }
    if (binding.shift) {
      parts.push("Shift");
    }
    parts.push(binding.key.toUpperCase());
    return parts.join(isMac ? "" : " + ");
  }

  return (
    <ShortcutContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        resetShortcuts,
        formatBinding,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcuts() {
  const context = useContext(ShortcutContext);
  if (!context) {
    return {
      shortcuts: DEFAULT_SHORTCUTS,
      updateShortcut: () => {},
      resetShortcuts: () => {},
      formatBinding: (binding: ShortcutBinding) => {
        if (!binding || !binding.key) return "";
        const parts: string[] = [];
        if (binding.ctrlOrCmd) parts.push("Ctrl");
        if (binding.alt) parts.push("Alt");
        if (binding.shift) parts.push("Shift");
        parts.push(binding.key.toUpperCase());
        return parts.join(" + ");
      },
    };
  }
  return context;
}

