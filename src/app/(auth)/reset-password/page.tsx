"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/server/actions/auth-actions";

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

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const res = await updatePasswordAction(formData);
      setIsLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || "Failed to update password.");
        return;
      }

      setSuccessMsg("Your password has been securely updated. Redirecting to your space...");
      setTimeout(() => {
        router.push("/today");
        router.refresh();
      }, 2000);
    } catch {
      setErrorMsg("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Security
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Create new password.
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Please enter and confirm your new secure password below.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 p-4 text-xs text-ember font-medium animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-moss/40 bg-paper-deep p-4 text-xs text-ink font-medium animate-in fade-in duration-200">
          {successMsg}
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              New Password
            </label>
            <div className="relative mt-2">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-rule bg-paper px-4 py-3 pr-11 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-ink-muted/70 hover:text-ink transition-colors cursor-pointer rounded focus:outline-none"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Confirm New Password
            </label>
            <div className="relative mt-2">
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-rule bg-paper px-4 py-3 pr-11 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-ink py-3.5 px-6 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs font-medium"
          >
            {isLoading ? "Updating Password..." : "Update Password →"}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="font-sans text-xs uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
        >
          ← Return to Log In
        </Link>
      </div>
    </div>
  );
}
