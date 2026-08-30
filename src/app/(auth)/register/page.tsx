"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/server/actions/auth-actions";

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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPasswordLongEnough = password.length >= 8;
  const isPasswordMatching = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isPasswordLongEnough) {
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
      formData.set("name", name);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const result = await signUpAction(formData);

      if (!result.success) {
        setErrorMsg(result.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      if (result.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/today");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message ||
        "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Begin Your Journey
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Create your space.
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Set daily intentions, reflect honestly at night, and observe your patterns privately.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 p-4 text-xs text-ember font-medium animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="register-name"
            className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
          >
            Your Name
          </label>
          <input
            id="register-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pranav"
            className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
          >
            Email Address
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
          >
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
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
            htmlFor="register-confirm"
            className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
          >
            Confirm Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="register-confirm"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-lg border border-rule bg-paper px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
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

        {/* Password criteria indicators */}
        <div className="flex items-center gap-4 text-[0.7rem] font-sans text-ink-muted pt-1">
          <span className={isPasswordLongEnough ? "text-moss font-medium" : ""}>
            {isPasswordLongEnough ? "✓" : "○"} 8+ characters
          </span>
          {confirmPassword && (
            <span className={isPasswordMatching ? "text-moss font-medium" : "text-ember"}>
              {isPasswordMatching ? "✓ Passwords match" : "○ Passwords do not match"}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-ink py-3.5 px-6 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs font-medium mt-2"
        >
          {isLoading ? "Creating Account..." : "Create Account →"}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-ink hover:text-moss underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
