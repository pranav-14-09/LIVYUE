"use client";

import { useMemo, useState } from "react";
import { AuthenticatedUser, useLivyue } from "@/lib/use-livyue";
import { LivyueStoreData, UserSettings } from "@/lib/types";
import { ThemeSelector, useTheme } from "@/lib/theme";
import {
  signOutAction,
  updatePasswordAction,
} from "@/server/actions/auth-actions";

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499A10.75 10.75 0 0 1 2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.246-4.246" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-rule/50 last:border-b-0">
      <div className="space-y-0.5 pr-2">
        <span className="block font-sans text-xs uppercase tracking-[0.16em] text-ink font-medium">
          {label}
        </span>
        {description && (
          <p className="text-xs text-ink-muted leading-relaxed max-w-md">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-rule transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-moss/80 dark:bg-moss" : "bg-paper-deep/60 dark:bg-paper-ink"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-xs transition duration-200 ease-in-out mt-[1px] ml-[1px] ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

interface SettingsFormProps {
  store: LivyueStoreData;
  user: AuthenticatedUser | null;
  migrationNotice: string | null;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

function SettingsForm({
  store,
  user,
  migrationNotice,
  updateSettings,
}: SettingsFormProps) {
  const { theme } = useTheme();

  const [name, setName] = useState(
    () => store.settings?.userName || user?.name || ""
  );
  const [morningPrompt, setMorningPrompt] = useState(
    () =>
      store.settings?.morningPromptText ||
      "What is one thing that would make today feel well-lived?"
  );
  const [eveningPrompt, setEveningPrompt] = useState(
    () =>
      store.settings?.eveningPromptText ||
      "What was most meaningful or challenging about today?"
  );
  const [morningTime, setMorningTime] = useState(
    () => store.settings?.morningCheckInTime || "08:00"
  );
  const [eveningTime, setEveningTime] = useState(
    () => store.settings?.eveningCheckInTime || "21:00"
  );
  const [startPage, setStartPage] = useState<"today" | "history">(
    () => store.settings?.startPage || "today"
  );
  const [showCompleted, setShowCompleted] = useState(
    () => store.settings?.showCompleted ?? true
  );
  const [confirmDelete, setConfirmDelete] = useState(
    () => store.settings?.confirmBeforeDelete ?? true
  );
  const [enableInsights, setEnableInsights] = useState(
    () => store.settings?.enableDailyInsights ?? true
  );

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Account & Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    const currentStoreName = store.settings?.userName || user?.name || "";
    const currentMorningPrompt =
      store.settings?.morningPromptText ||
      "What is one thing that would make today feel well-lived?";
    const currentEveningPrompt =
      store.settings?.eveningPromptText ||
      "What was most meaningful or challenging about today?";
    const currentMorningTime = store.settings?.morningCheckInTime || "08:00";
    const currentEveningTime = store.settings?.eveningCheckInTime || "21:00";
    const currentStartPage = store.settings?.startPage || "today";
    const currentShowCompleted = store.settings?.showCompleted ?? true;
    const currentConfirmDelete = store.settings?.confirmBeforeDelete ?? true;
    const currentEnableInsights = store.settings?.enableDailyInsights ?? true;

    return (
      name.trim() !== currentStoreName.trim() ||
      morningPrompt.trim() !== currentMorningPrompt.trim() ||
      eveningPrompt.trim() !== currentEveningPrompt.trim() ||
      morningTime !== currentMorningTime ||
      eveningTime !== currentEveningTime ||
      startPage !== currentStartPage ||
      showCompleted !== currentShowCompleted ||
      confirmDelete !== currentConfirmDelete ||
      enableInsights !== currentEnableInsights
    );
  }, [
    name,
    morningPrompt,
    eveningPrompt,
    morningTime,
    eveningTime,
    startPage,
    showCompleted,
    confirmDelete,
    enableInsights,
    store.settings,
    user,
  ]);

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings({
      userName: name.trim(),
      morningPromptText: morningPrompt.trim(),
      eveningPromptText: eveningPrompt.trim(),
      morningCheckInTime: morningTime,
      eveningCheckInTime: eveningTime,
      startPage,
      showCompleted,
      confirmBeforeDelete: confirmDelete,
      enableDailyInsights: enableInsights,
      themeMode: theme,
    });
    setSaveStatus("SAVED ✓");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    setPasswordLoading(true);
    const formData = new FormData();
    formData.set("password", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const res = await updatePasswordAction(formData);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordFeedback({
        type: "error",
        text: res.error || "Failed to update password.",
      });
      return;
    }

    setPasswordFeedback({
      type: "success",
      text: "Password successfully updated.",
    });
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordFeedback(null);
    }, 2000);
  };

  const displayName = name.trim() || user?.name || "Add your name";

  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-rule pb-6">
        <span className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted">
          YOURS
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink tracking-[-0.01em]">
          Settings & Routine
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Your private space to shape how LIVYUE fits into your everyday life.
        </p>

        {migrationNotice && (
          <div className="mt-4 rounded-lg border border-moss/40 bg-paper-deep/60 p-3 text-xs text-moss font-medium animate-in fade-in duration-200">
            {migrationNotice}
          </div>
        )}
      </div>

      {/* SECTION 1 — YOUR PROFILE */}
      <section aria-labelledby="section-profile" className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="section-profile" className="font-serif text-xl sm:text-2xl text-ink">
              Your Profile
            </h2>
            <p className="text-xs text-ink-muted">How LIVYUE knows you.</p>
          </div>
          <form action={signOutAction} className="shrink-0 pt-0.5">
            <button
              type="submit"
              className="font-sans text-xs uppercase tracking-[0.2em] font-semibold text-ink hover:text-ember transition-colors cursor-pointer"
            >
              Sign Out →
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 sm:p-6 space-y-6 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          {/* Prominent Name Header */}
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-rule/60">
            <div>
              <span className="block font-sans text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                Name or Moniker
              </span>
              <p className="mt-1 font-serif text-2xl text-ink font-medium">
                {displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("field-name-voice");
                if (el) el.focus();
              }}
              className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Edit →
            </button>
          </div>

          {/* Account Email (Read-Only) & Verified Badge */}
          <div className="space-y-1 pb-5 border-b border-rule/60">
            <span className="block font-sans text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
              Email
            </span>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="font-sans text-sm text-ink">
                {user?.email || "Local Guest Mode"}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-3 py-1 text-[0.7rem] font-sans uppercase tracking-wider text-moss font-medium">
                ✓ {user?.isVerified ? "Verified account" : "Authenticated session"}
              </span>
            </div>
          </div>

          {/* Password Security Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="block font-sans text-[0.68rem] uppercase tracking-[0.2em] text-ink-muted font-medium">
                Password
              </span>
              <p className="mt-1 font-sans text-sm text-ink-muted">
                Password protected
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="rounded border border-rule px-4 py-2 font-sans text-xs uppercase tracking-[0.18em] text-ink hover:bg-paper-deep/60 transition-colors cursor-pointer font-medium"
            >
              Change Password →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — YOUR VOICE */}
      <section aria-labelledby="section-voice" className="space-y-4">
        <div>
          <h2 id="section-voice" className="font-serif text-xl sm:text-2xl text-ink">
            Your Voice
          </h2>
          <p className="text-xs text-ink-muted">
            The tone, prompts, and personal name that ground your daily practice.
          </p>
        </div>

        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 sm:p-6 space-y-6 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          <div>
            <label
              htmlFor="field-name-voice"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Preferred Name / Moniker
            </label>
            <p className="text-xs text-ink-muted mt-0.5">
              How LIVYUE refers to you across daily greetings and insights.
            </p>
            <input
              id="field-name-voice"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya"
              className="mt-2 w-full rounded border border-rule bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-rule/50">
            <label
              htmlFor="field-morning-prompt"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Morning Reflection Prompt
            </label>
            <p className="text-xs text-ink-muted mt-0.5">
              The opening question that greets you when setting morning intentions.
            </p>
            <textarea
              id="field-morning-prompt"
              rows={2}
              value={morningPrompt}
              onChange={(e) => setMorningPrompt(e.target.value)}
              placeholder="What is one thing that would make today feel well-lived?"
              className="mt-2 w-full rounded border border-rule bg-paper p-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-rule/50">
            <label
              htmlFor="field-evening-prompt"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Night Reflection Prompt
            </label>
            <p className="text-xs text-ink-muted mt-0.5">
              The closing question that grounds your honest night check-in.
            </p>
            <textarea
              id="field-evening-prompt"
              rows={2}
              value={eveningPrompt}
              onChange={(e) => setEveningPrompt(e.target.value)}
              placeholder="What was most meaningful or challenging about today?"
              className="mt-2 w-full rounded border border-rule bg-paper p-3 text-sm text-ink placeholder:text-ink-muted/50 focus:border-ink focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3 — DAILY RHYTHM */}
      <section aria-labelledby="section-rhythm" className="space-y-4">
        <div>
          <h2 id="section-rhythm" className="font-serif text-xl sm:text-2xl text-ink">
            Daily Rhythm
          </h2>
          <p className="text-xs text-ink-muted">
            The target check-in hours that mark your day&apos;s opening and closing.
          </p>
        </div>

        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 sm:p-6 space-y-6 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="field-morning-time"
                className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
              >
                Morning Intention Target
              </label>
              <p className="text-xs text-ink-muted mt-0.5">
                Ideal hour to set your focus.
              </p>
              <input
                id="field-morning-time"
                type="time"
                value={morningTime}
                onChange={(e) => setMorningTime(e.target.value)}
                className="mt-2 w-full rounded border border-rule bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="field-evening-time"
                className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
              >
                Night Reflection Target
              </label>
              <p className="text-xs text-ink-muted mt-0.5">
                Ideal hour to evaluate and rest.
              </p>
              <input
                id="field-evening-time"
                type="time"
                value={eveningTime}
                onChange={(e) => setEveningTime(e.target.value)}
                className="mt-2 w-full rounded border border-rule bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — DAILY INTENTIONS & NAVIGATION */}
      <section aria-labelledby="section-intentions" className="space-y-4">
        <div>
          <h2 id="section-intentions" className="font-serif text-xl sm:text-2xl text-ink">
            Navigation Preference
          </h2>
          <p className="text-xs text-ink-muted">
            Customize which page opens first upon launching LIVYUE.
          </p>
        </div>

        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 sm:p-6 space-y-5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          <div>
            <label
              htmlFor="field-start-page"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Default Landing View
            </label>
            <select
              id="field-start-page"
              value={startPage}
              onChange={(e) =>
                setStartPage(e.target.value as "today" | "history")
              }
              className="mt-2 w-full rounded border border-rule bg-paper px-3.5 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="today">Today (Morning & Night Journal)</option>
              <option value="history">The Timeline (Past Days Archive)</option>
            </select>
          </div>
        </div>
      </section>

      {/* SECTION 5 — EXPERIENCE & PREFERENCES */}
      <section aria-labelledby="section-experience" className="space-y-4">
        <div>
          <h2 id="section-experience" className="font-serif text-xl sm:text-2xl text-ink">
            Experience & Preferences
          </h2>
          <p className="text-xs text-ink-muted">
            Quiet defaults and display behaviors.
          </p>
        </div>

        <div className="rounded-xl border border-rule/80 bg-paper-card backdrop-blur-md p-5 sm:p-6 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.02)]">
          <div className="divide-y divide-rule/50">
            <ToggleSwitch
              checked={confirmDelete}
              onChange={setConfirmDelete}
              label="Confirm Deletions"
              description="Ask for confirmation before deleting intentions or days."
            />
            <ToggleSwitch
              checked={enableInsights}
              onChange={setEnableInsights}
              label="Daily Honest Insights"
              description="Show gentle patterns and observations based on your reflections."
            />
            <ToggleSwitch
              checked={showCompleted}
              onChange={setShowCompleted}
              label="Show Completed"
              description="Keep completed intentions visible in your daily landscape."
            />
          </div>
        </div>
      </section>

      {/* SECTION 6 — APPEARANCE */}
      <section aria-labelledby="section-appearance" className="space-y-4">
        <div>
          <h2 id="section-appearance" className="font-serif text-xl sm:text-2xl text-ink">
            Appearance
          </h2>
          <p className="text-xs text-ink-muted">
            Choose the atmosphere you want LIVYUE to keep.
          </p>
        </div>

        <div className="rounded-xl border border-rule bg-paper-deep/20 p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <span className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium">
              Theme Atmosphere
            </span>
            <p className="text-xs text-ink-muted mt-0.5">
              {theme === "dark" ? "Late evening quiet desk mode" : "Warm morning paper light"}
            </p>
          </div>

          {/* Circular Sun / Moon Theme Control */}
          <ThemeSelector />
        </div>
      </section>

      {/* STICKY / BOTTOM SAVE BAR */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl border border-rule bg-paper/95 backdrop-blur-md p-4 shadow-lg">
        <div className="flex items-center gap-3">
          {saveStatus ? (
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-moss font-semibold animate-in fade-in duration-200">
              {saveStatus}
            </span>
          ) : hasUnsavedChanges ? (
            <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted animate-pulse">
              Unsaved changes
            </span>
          ) : (
            <span className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted/60">
              All preferences synced
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={!hasUnsavedChanges && !saveStatus}
          className="rounded-lg bg-ink px-6 py-2.5 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer font-medium"
        >
          Save Preferences
        </button>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-ink/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-rule bg-paper p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-150">
            <h2 className="font-serif text-2xl text-ink">
              Change Account Password
            </h2>
            <p className="mt-2 text-xs text-ink-muted">
              Enter your new secure password below (minimum 8 characters).
            </p>

            {passwordFeedback && (
              <div
                className={`mt-4 rounded-lg p-3 text-xs font-medium ${
                  passwordFeedback.type === "success"
                    ? "border border-moss/40 bg-paper-deep text-moss"
                    : "border border-ember/30 bg-ember/10 text-ember"
                }`}
              >
                {passwordFeedback.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="change-password-new"
                  className="block font-sans text-xs uppercase tracking-wider text-ink font-medium"
                >
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="change-password-new"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded border border-rule bg-paper-deep/20 px-3.5 py-2 pr-11 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-ink-muted/70 hover:text-ink transition-colors cursor-pointer rounded focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="change-password-confirm"
                  className="block font-sans text-xs uppercase tracking-wider text-ink font-medium"
                >
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="change-password-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded border border-rule bg-paper-deep/20 px-3.5 py-2 pr-11 text-sm text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-ink-muted/70 hover:text-ink transition-colors cursor-pointer rounded focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-rule pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded px-4 py-2 font-sans text-xs uppercase tracking-[0.2em] text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded bg-ink px-5 py-2 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 disabled:opacity-50 cursor-pointer font-medium"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const livyue = useLivyue();

  if (!livyue.isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted animate-pulse">
          Opening Settings...
        </p>
      </div>
    );
  }

  const formKey = `${livyue.isCloudLoaded ? "cloud" : "local"}-${livyue.user?.id || "anon"}`;

  return <SettingsForm key={formKey} {...livyue} />;
}
