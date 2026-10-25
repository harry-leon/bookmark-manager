"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Toaster } from "sonner";

import { AppFooter } from "./app-footer";

// Dynamically import heavy modals to optimize initial bundle size & LCP
const CommandPalette = dynamic(
  () => import("./command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

const PackageDialog = dynamic(
  () => import("@/features/packages/package-dialog").then((mod) => mod.PackageDialog),
  { ssr: false }
);

const UrlDialog = dynamic(
  () => import("@/features/urls/url-dialog").then((mod) => mod.UrlDialog),
  { ssr: false }
);

const NoteDialog = dynamic(
  () => import("@/features/notes/note-dialog").then((mod) => mod.NoteDialog),
  { ssr: false }
);

const TaskDialog = dynamic(
  () => import("@/features/tasks/task-dialog").then((mod) => mod.TaskDialog),
  { ssr: false }
);

import { useShortcuts, ShortcutBinding } from "@/lib/shortcuts/shortcut-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const [commandOpen, setCommandOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const { shortcuts } = useShortcuts();

  // Dynamic Custom Keyboard Shortcuts execution
  useEffect(() => {
    function matchesBinding(e: KeyboardEvent, binding: ShortcutBinding): boolean {
      if (!binding || !binding.key) return false;
      const keyMatches = e.key.toLowerCase() === binding.key.toLowerCase();
      const ctrlOrCmdMatches = Boolean(binding.ctrlOrCmd) === (e.ctrlKey || e.metaKey);
      const shiftMatches = Boolean(binding.shift) === e.shiftKey;
      const altMatches = Boolean(binding.alt) === e.altKey;

      return keyMatches && ctrlOrCmdMatches && shiftMatches && altMatches;
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // 1. Quick Search (allowed everywhere)
      if (matchesBinding(e, shortcuts.openSearch)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }

      // If user is actively typing in a form input, skip creation shortcuts
      if (isInput) return;

      // 2. New Bookmark / URL
      if (matchesBinding(e, shortcuts.openNewUrl)) {
        e.preventDefault();
        setUrlDialogOpen(true);
        return;
      }

      // 3. New Package
      if (matchesBinding(e, shortcuts.openNewPackage)) {
        e.preventDefault();
        setPackageDialogOpen(true);
        return;
      }

      // 4. New Note
      if (matchesBinding(e, shortcuts.openNewNote)) {
        e.preventDefault();
        setNoteDialogOpen(true);
        return;
      }

      // 5. New Task
      if (matchesBinding(e, shortcuts.openNewTask)) {
        e.preventDefault();
        setTaskDialogOpen(true);
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  // Listen to custom open events from child views
  useEffect(() => {
    const handleOpenNewUrl = () => setUrlDialogOpen(true);
    const handleOpenNewPkg = () => setPackageDialogOpen(true);

    window.addEventListener("open-new-url", handleOpenNewUrl);
    window.addEventListener("open-new-package", handleOpenNewPkg);

    return () => {
      window.removeEventListener("open-new-url", handleOpenNewUrl);
      window.removeEventListener("open-new-package", handleOpenNewPkg);
    };
  }, []);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isIntroPage = pathname === "/intro" || pathname === "/about";
  const isPublicLanding = pathname === "/" && status === "unauthenticated";

  if (isAuthPage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-2.5 xs:p-3.5 sm:p-4 bg-background w-full overflow-x-hidden">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    );
  }

  if (isIntroPage || isPublicLanding) {
    return (
      <main className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </main>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        className="hidden md:flex shrink-0"
        onOpenNewPackage={() => setPackageDialogOpen(true)}
        onOpenCommandPalette={() => setCommandOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <AppFooter />
      </div>

      {/* Global Command Palette */}
      {commandOpen && (
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onOpenNewPackage={() => setPackageDialogOpen(true)}
          onOpenNewUrl={() => setUrlDialogOpen(true)}
        />
      )}

      {/* Global Package Dialog */}
      {packageDialogOpen && (
        <PackageDialog
          open={packageDialogOpen}
          onOpenChange={setPackageDialogOpen}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("refresh-packages"));
          }}
        />
      )}

      {/* Global URL Dialog */}
      {urlDialogOpen && (
        <UrlDialog
          open={urlDialogOpen}
          onOpenChange={setUrlDialogOpen}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("refresh-urls"));
            window.dispatchEvent(new CustomEvent("refresh-packages"));
          }}
        />
      )}

      {/* Global Note Dialog */}
      {noteDialogOpen && (
        <NoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("refresh-notes"));
          }}
        />
      )}

      {/* Global Task Dialog */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("refresh-tasks"));
          }}
        />
      )}

      {/* Toast notifications */}
      <Toaster position="bottom-right" richColors theme="system" />
    </div>
  );
}
