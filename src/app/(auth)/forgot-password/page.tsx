"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/server/actions/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("email", email);

    const res = await forgotPasswordAction(formData);
    setIsLoading(false);
    setMessage(
      res.message ||
        "If an account with that email exists, we've sent a link to reset your password."
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Account Recovery
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Reset password.
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
          Enter your account email to receive a secure password reset link.
        </p>
      </div>

      {message ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-moss/40 bg-paper-deep p-4 text-xs text-ink leading-relaxed">
            {message}
          </div>
          <Link
            href="/login"
            className="block text-center font-sans text-xs uppercase tracking-[0.2em] text-ink hover:text-moss underline underline-offset-4"
          >
            ← Back to Log In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="reset-email"
              className="block font-sans text-xs uppercase tracking-[0.18em] text-ink font-medium"
            >
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-muted/40 focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-ink py-3.5 px-6 font-sans text-xs uppercase tracking-[0.22em] text-paper hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs font-medium"
          >
            {isLoading ? "Sending Link..." : "Send Reset Link →"}
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
