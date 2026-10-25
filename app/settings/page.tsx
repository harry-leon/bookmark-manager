"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TopHeader } from "@/components/layout/top-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User,
  HardDrive,
  Keyboard,
  RotateCcw,
  Check,
  Calendar,
  Mail,
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Link2,
  FileText,
  Tag,
  CheckSquare,
  Image as ImageIcon,
  Paperclip,
  Radio,
} from "lucide-react";
import {
  useShortcuts,
  ShortcutAction,
  ShortcutBinding,
} from "@/lib/shortcuts/shortcut-context";
import { cn } from "@/lib/utils";

interface QuotaItem {
  used: number;
  limit: number;
  pct: number;
}

interface QuotaData {
  usage: Record<string, QuotaItem>;
  limits: Record<string, number>;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function QuotaBar({
  label,
  icon: Icon,
  used,
  limit,
  pct,
  formatFn,
}: {
  label: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  pct: number;
  formatFn?: (n: number) => string;
}) {
  const fmt = formatFn ?? ((n: number) => n.toLocaleString());
  return (
    <div className="space-y-1.5 p-3 sm:p-4 rounded-xl border border-border/60 bg-card/40 shadow-2xs">
      <div className="flex items-center justify-between text-xs gap-1.5">
        <span className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        <span
          className={cn(
            "font-mono text-xs",
            pct >= 95
              ? "text-destructive font-bold"
              : pct >= 80
              ? "text-amber-500 font-semibold"
              : "text-muted-foreground"
          )}
        >
          {fmt(used)} / {fmt(limit)}
          <span className="ml-1 text-[11px] font-normal opacity-70">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", {
            "bg-destructive": pct >= 95,
            "bg-amber-500": pct >= 80 && pct < 95,
            "bg-primary": pct < 80,
          })}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {pct >= 80 && (
        <p
          className={cn(
            "text-[11px] pt-0.5",
            pct >= 95 ? "text-destructive" : "text-amber-500"
          )}
        >
          {pct >= 95 ? "⚠️ Near quota limit — " : "ℹ️ Approaching limit — "}
          {fmt(limit - used)} remaining
        </p>
      )}
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  const tabParam = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(tabParam);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    router.push(`/settings?tab=${tab}`, { scroll: false });
  }

  // --- Profile State ---
  const [name, setName] = useState(session?.user?.name || "");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [nameError, setNameError] = useState("");
  const [profileFormError, setProfileFormError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUserProfile(data.user);
          setName(data.user.name || "");
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setProfileLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setProfileFormError("");

    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      toast.success("Profile updated successfully");
      await updateSession();
      setUserProfile((prev: any) => ({ ...prev, name: name.trim() }));
    } catch (err: unknown) {
      setProfileFormError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  }

  // --- Password Management State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [passwordFormError, setPasswordFormError] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setPasswordFormError("");

    if (!currentPassword) {
      setCurrentPasswordError("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setNewPasswordError("New password must be at least 8 characters");
      return;
    }
    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setNewPasswordError("New password must contain lowercase, uppercase, and numbers");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("New password and confirmation do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setNewPasswordError("New password must be different from current password");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordFormError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  // --- Storage Quota State ---
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "quota") {
      setQuotaLoading(true);
      fetch("/api/user/quota")
        .then((r) => r.json())
        .then((d) => setQuotaData(d))
        .catch(() => toast.error("Failed to load quota"))
        .finally(() => setQuotaLoading(false));
    }
  }, [activeTab]);

  // --- Keyboard Shortcuts State ---
  const { shortcuts, updateShortcut, resetShortcuts, formatBinding } = useShortcuts();
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);

  useEffect(() => {
    if (!recordingAction) return;

    function handleKeyCapture(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      // Ignore lone modifier keys
      if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) {
        return;
      }

      // Must have Ctrl or Meta (Cmd) for safety against accidental typing
      const key = e.key.toLowerCase();
      updateShortcut(recordingAction!, {
        key,
        ctrlOrCmd: e.ctrlKey || e.metaKey || true,
        shift: e.shiftKey,
        alt: e.altKey,
      });

      toast.success(`Shortcut for ${shortcuts[recordingAction!].label} updated`);
      setRecordingAction(null);
    }

    window.addEventListener("keydown", handleKeyCapture, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyCapture, { capture: true });
  }, [recordingAction, shortcuts, updateShortcut]);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <TopHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Settings" },
        ]}
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-6">
        {/* Navigation Tabs Header */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4 sm:space-y-6">
          <div className="border-b border-border/60 pb-2 sm:pb-3 overflow-x-auto no-scrollbar">
            <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/50 h-9 sm:h-10 inline-flex w-auto">
              <TabsTrigger
                value="profile"
                className="gap-1.5 sm:gap-2 text-[11px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-xs px-2.5 sm:px-4 rounded-lg shrink-0"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Account & Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="quota"
                className="gap-1.5 sm:gap-2 text-[11px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-xs px-2.5 sm:px-4 rounded-lg shrink-0"
              >
                <HardDrive className="h-3.5 w-3.5 text-primary" />
                <span>Storage & Quotas</span>
              </TabsTrigger>
              <TabsTrigger
                value="shortcuts"
                className="gap-1.5 sm:gap-2 text-[11px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-xs px-2.5 sm:px-4 rounded-lg shrink-0"
              >
                <Keyboard className="h-3.5 w-3.5 text-primary" />
                <span>Keyboard Shortcuts</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Profile & Account Settings */}
          <TabsContent value="profile" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Profile Information</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your display name and review account details.
                </p>
              </div>

              {profileLoading ? (
                <div className="space-y-4 max-w-md">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md">
                  {/* Avatar Preview & Name */}
                  <div className="flex items-center gap-3.5 pb-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xl border border-primary/20 shadow-xs">
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{name || "User"}</span>
                      <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
                    </div>
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Display Name</label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError("");
                        if (profileFormError) setProfileFormError("");
                      }}
                      placeholder="Your full name"
                      className={cn("h-9 text-xs", nameError && "border-destructive focus-visible:ring-destructive")}
                      disabled={profileSaving}
                    />
                    {nameError && (
                      <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email Address</label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/30 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{userProfile?.email}</span>
                      <span className="ml-auto text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Your login email is managed securely via credentials or OAuth.
                    </p>
                  </div>

                  {/* Account Metadata */}
                  {userProfile?.createdAt && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-mono">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Member since {new Date(userProfile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {profileFormError && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium animate-in fade-in-50">
                      {profileFormError}
                    </div>
                  )}

                  <Button type="submit" size="sm" disabled={profileSaving} className="gap-1.5">
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              )}
            </div>

            {/* Security & Password Card */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Security & Password</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your account password to ensure your bookmarks remain protected.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>OWASP 12-round bcrypt</span>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Current Password</label>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showCurrentPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (currentPasswordError) setCurrentPasswordError("");
                      if (passwordFormError) setPasswordFormError("");
                    }}
                    placeholder="Enter current password"
                    className={cn("h-9 text-xs", currentPasswordError && "border-destructive focus-visible:ring-destructive")}
                    disabled={passwordSaving}
                  />
                  {currentPasswordError && (
                    <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                      {currentPasswordError}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">New Password</label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showNewPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError("");
                      if (passwordFormError) setPasswordFormError("");
                    }}
                    placeholder="Min. 8 chars with uppercase, lowercase & number"
                    className={cn("h-9 text-xs", newPasswordError && "border-destructive focus-visible:ring-destructive")}
                    disabled={passwordSaving}
                  />
                  {newPasswordError && (
                    <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                      {newPasswordError}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showConfirmPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                      if (passwordFormError) setPasswordFormError("");
                    }}
                    placeholder="Repeat new password"
                    className={cn("h-9 text-xs", confirmPasswordError && "border-destructive focus-visible:ring-destructive")}
                    disabled={passwordSaving}
                  />
                  {confirmPasswordError && (
                    <p className="text-destructive text-xs mt-1 animate-in fade-in-50">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {passwordFormError && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium animate-in fade-in-50">
                    {passwordFormError}
                  </div>
                )}

                <Button type="submit" size="sm" disabled={passwordSaving} className="gap-1.5">
                  {passwordSaving ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 2: Storage & Quotas */}
          <TabsContent value="quota" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Storage & Resource Quotas</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time resource utilization across your bookmarks, notes, attachments, and cloud storage.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Enforced by policy</span>
                </div>
              </div>

              {quotaLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : !quotaData ? (
                <p className="text-sm text-muted-foreground">Could not load quota metrics.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <QuotaBar
                    label="Saved URLs"
                    icon={Link2}
                    used={quotaData.usage.urls?.used ?? 0}
                    limit={quotaData.usage.urls?.limit ?? 0}
                    pct={quotaData.usage.urls?.pct ?? 0}
                  />
                  <QuotaBar
                    label="Notes"
                    icon={FileText}
                    used={quotaData.usage.notes?.used ?? 0}
                    limit={quotaData.usage.notes?.limit ?? 0}
                    pct={quotaData.usage.notes?.pct ?? 0}
                  />
                  <QuotaBar
                    label="Tasks"
                    icon={CheckSquare}
                    used={quotaData.usage.tasks?.used ?? 0}
                    limit={quotaData.usage.tasks?.limit ?? 0}
                    pct={quotaData.usage.tasks?.pct ?? 0}
                  />
                  <QuotaBar
                    label="Tags"
                    icon={Tag}
                    used={quotaData.usage.tags?.used ?? 0}
                    limit={quotaData.usage.tags?.limit ?? 0}
                    pct={quotaData.usage.tags?.pct ?? 0}
                  />
                  <QuotaBar
                    label="Packages"
                    icon={HardDrive}
                    used={quotaData.usage.packages?.used ?? 0}
                    limit={quotaData.usage.packages?.limit ?? 0}
                    pct={quotaData.usage.packages?.pct ?? 0}
                  />
                  <QuotaBar
                    label="File Attachments"
                    icon={Paperclip}
                    used={quotaData.usage.attachments?.used ?? 0}
                    limit={quotaData.usage.attachments?.limit ?? 0}
                    pct={quotaData.usage.attachments?.pct ?? 0}
                  />
                  <div className="md:col-span-2">
                    <QuotaBar
                      label="Cloud Object Storage (Images)"
                      icon={ImageIcon}
                      used={quotaData.usage.attachmentBytes?.used ?? 0}
                      limit={quotaData.usage.attachmentBytes?.limit ?? 0}
                      pct={quotaData.usage.attachmentBytes?.pct ?? 0}
                      formatFn={formatBytes}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Keyboard Shortcuts */}
          <TabsContent value="shortcuts" className="space-y-4 sm:space-y-6 focus-visible:outline-none">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure your preferred quick-launch keybindings for seamless navigation.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetShortcuts();
                    toast.success("Shortcuts reset to defaults");
                  }}
                  className="h-8 text-xs gap-1.5 self-start sm:self-auto"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Defaults</span>
                </Button>
              </div>

              {/* Shortcuts Table / Card List */}
              <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-background/50 overflow-hidden">
                {(Object.entries(shortcuts) as [ShortcutAction, ShortcutBinding][]).map(
                  ([action, binding]) => {
                    const isRecording = recordingAction === action;

                    return (
                      <div
                        key={action}
                        className={cn(
                          "flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 gap-2.5 sm:gap-3 transition-colors",
                          isRecording ? "bg-primary/10 ring-1 ring-primary inset-0" : "hover:bg-muted/20"
                        )}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground">
                            {binding.label}
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            {binding.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {isRecording ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary bg-primary/20 text-xs text-primary animate-pulse font-mono font-semibold">
                              <Radio className="h-3.5 w-3.5 animate-spin" />
                              <span>Press key combo...</span>
                            </div>
                          ) : (
                            <kbd className="inline-flex h-7 items-center justify-center rounded-md border border-border/80 bg-muted/60 px-2.5 font-mono text-xs font-semibold text-foreground shadow-2xs">
                              {formatBinding(binding)}
                            </kbd>
                          )}

                          <Button
                            variant={isRecording ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (isRecording) {
                                setRecordingAction(null);
                              } else {
                                setRecordingAction(action);
                              }
                            }}
                            className="h-7 text-xs px-2.5"
                          >
                            {isRecording ? "Cancel" : "Record"}
                          </Button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <TopHeader breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />
          <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-4">
            <Skeleton className="h-10 w-72 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
