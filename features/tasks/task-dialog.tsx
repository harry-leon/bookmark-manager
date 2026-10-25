"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface TaskDialogItem {
  id?: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueAt?: string | null;
  reminderAt?: string | null;
  packageId?: string | null;
  sectionId?: string | null;
  urlId?: string | null;
  noteId?: string | null;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskDialogItem | null;
  defaultUrlId?: string | null;
  defaultPackageId?: string | null;
  onSuccess?: () => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultUrlId,
  defaultPackageId,
  onSuccess,
}: TaskDialogProps) {
  const isEditing = Boolean(task?.id);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueAt, setDueAt] = useState("");
  const [reminderAt, setReminderAt] = useState("");

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || "TODO");
        setPriority(task.priority || "MEDIUM");
        setDueAt(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "");
        setReminderAt(task.reminderAt ? new Date(task.reminderAt).toISOString().slice(0, 16) : "");
      } else {
        setTitle("");
        setDescription("");
        setStatus("TODO");
        setPriority("MEDIUM");
        setDueAt("");
        setReminderAt("");
      }
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
      };

      if (!isEditing) {
        if (defaultUrlId) payload.urlId = defaultUrlId;
        if (defaultPackageId) payload.packageId = defaultPackageId;
      }

      const url = isEditing ? `/api/tasks/${task!.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === "QUOTA_EXCEEDED") {
          toast.error(data.error.message);
        } else {
          toast.error(data.error || "Failed to save task");
        }
        return;
      }

      toast.success(isEditing ? "Task updated" : "Task created");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Task Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review link contents, submit feedback..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Due Date</label>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reminder Time</label>
              <Input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
