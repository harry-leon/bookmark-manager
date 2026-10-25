"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskDialog } from "@/features/tasks/task-dialog";
import { toast } from "sonner";

import {
  CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, Circle,
  ChevronUp, ChevronDown, Minus, Pencil, Trash2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TaskStatus   = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
type FilterTab    = "all" | "upcoming" | "overdue" | "done";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  reminderAt?: string | null;
  reminderSentAt?: string | null;
  url?:     { id: string; title: string; url: string } | null;
  package?: { id: string; name: string; color: string } | null;
  note?:    { id: string; title: string } | null;
  createdAt: string;
}

const PRIORITY_ICONS: Record<TaskPriority, React.ReactNode> = {
  HIGH:   <ChevronUp   className="h-3.5 w-3.5 text-destructive" />,
  MEDIUM: <Minus       className="h-3.5 w-3.5 text-amber-500"   />,
  LOW:    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />,
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  TODO:        <Circle         className="h-4 w-4 text-muted-foreground"  />,
  IN_PROGRESS: <AlertCircle   className="h-4 w-4 text-blue-500"          />,
  DONE:        <CheckCircle2  className="h-4 w-4 text-emerald-500"        />,
};

const TAB_LABELS: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue",  label: "Overdue"  },
  { key: "done",     label: "Done"     },
];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks]     = useState<TaskItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<FilterTab>("all");
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);


  useEffect(() => { loadTasks(); }, [tab]);

  async function loadTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (tab === "done")     params.set("status", "DONE");
      else if (tab !== "all") params.set("filter", tab);
      else                    params.set("status", "TODO");

      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setTotal(data.total);
      }
    } catch { toast.error("Failed to load tasks"); }
    finally  { setLoading(false); }
  }

  async function cycleStatus(task: TaskItem) {
    const next: Record<TaskStatus, TaskStatus> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next[task.status] }),
      });
      if (res.ok) {
        toast.success(`Task marked ${next[task.status].replace("_", " ")}`);
        loadTasks();
      }
    } catch { toast.error("Failed to update task"); }
  }

  async function deleteTask(task: TaskItem) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        setDeletingTask(null);
        loadTasks();
      }
    } catch { toast.error("Failed to delete task"); }
  }

  function isOverdue(task: TaskItem): boolean {
    return Boolean(task.dueAt && new Date(task.dueAt) < new Date() && task.status !== "DONE");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        breadcrumbs={[{ label: "Tasks" }]}
        action={{
          label: "New Task",
          onClick: () => {
            setEditingTask(null);
            setTaskDialogOpen(true);
          },
          icon: Plus,
        }}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-4">
        {/* Filter tabs toolbar */}
        {/* Filter tabs toolbar */}
        <div className="flex items-center p-1 bg-muted/30 rounded-lg max-w-md border border-border/40 overflow-x-auto">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 text-[11px] sm:text-xs py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-md font-medium transition-colors shrink-0 xs:shrink",
                tab === key
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="No tasks" description="Create a task to get started." />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all",
                  task.status === "DONE"
                    ? "border-border/30 bg-muted/10 opacity-60"
                    : isOverdue(task)
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border/50 bg-card/40 hover:bg-card"
                )}
              >
                {/* Status toggle */}
                <button
                  onClick={() => cycleStatus(task)}
                  className="shrink-0 hover:scale-110 transition-transform p-0.5"
                  title={`Status: ${task.status}. Click to advance.`}
                >
                  {STATUS_ICONS[task.status]}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={cn("text-xs sm:text-sm font-medium", task.status === "DONE" && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    <span className="shrink-0" title={`Priority: ${task.priority}`}>
                      {PRIORITY_ICONS[task.priority]}
                    </span>
                    {isOverdue(task) && (
                      <Badge variant="destructive" className="text-[9px] sm:text-[10px] h-3.5 sm:h-4 px-1">OVERDUE</Badge>
                    )}
                    {task.reminderSentAt && task.status !== "DONE" && (
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] h-3.5 sm:h-4 px-1 text-amber-500 border-amber-500/50">⏰ Reminded</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground flex-wrap">
                    {task.dueAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Due {new Date(task.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    {task.url && (
                      <span className="flex items-center gap-1 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{task.url.title}</span>
                      </span>
                    )}
                    {task.package && (
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shrink-0" style={{ backgroundColor: task.package.color }} />
                        <span className="truncate max-w-[100px]">{task.package.name}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => {
                      setEditingTask(task);
                      setTaskDialogOpen(true);
                    }}
                    className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => setDeletingTask(task)}
                    className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        onSuccess={loadTasks}
      />

      <ConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        title={`Delete "${deletingTask?.title}"?`}
        description="This task will be permanently deleted."
        confirmLabel="Delete Task"
        onConfirm={() => deletingTask && deleteTask(deletingTask)}
      />
    </div>
  );
}

