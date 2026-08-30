"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAction } from "@/server/actions/auth-actions";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/today";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(urlError || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      const result = await signInAction(formData);

      if (!result.success) {
        setErrorMsg(result.error || "Failed to log in. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message ||
        "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-9 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-ink leading-tight tracking-[-0.02em]">
          Welcome back
        </h1>
        <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Sign in to continue your daily practice.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-ember/30 bg-ember/10 p-4 text-xs text-ember font-medium animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
          >
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="font-sans text-[0.68rem] uppercase tracking-[0.14em] text-ink-muted hover:text-ink transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-ink py-3.5 px-6 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs font-medium mt-1"
        >
          {isLoading ? "Signing in..." : "Sign In →"}
        </button>
      </form>

      <div className="text-center pt-1">
        <p className="text-xs text-ink-muted">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-medium text-ink hover:text-moss underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center">
          <p className="font-sans text-xs uppercase tracking-[0.24em] text-ink-muted animate-pulse">
            Loading...
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
