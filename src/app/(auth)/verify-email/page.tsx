"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resendVerificationAction } from "@/server/actions/auth-actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isResending, setIsResending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setFeedbackMsg(null);

    const res = await resendVerificationAction(email);
    setIsResending(false);
    setFeedbackMsg(res.message || res.error || null);
  };

  return (
    <div className="space-y-8 text-center animate-in fade-in duration-300">
      <div className="mx-auto w-16 h-16 rounded-full bg-paper-deep flex items-center justify-center border border-rule">
        <span className="text-2xl text-moss">✉</span>
      </div>

      <div className="space-y-2">
        <span className="font-sans text-[0.7rem] uppercase tracking-[0.24em] text-moss font-semibold">
          Check Your Inbox
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Verify your email.
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
          We&apos;ve sent a verification link to{" "}
          <strong className="text-ink font-medium">{email || "your email address"}</strong>.
          Click the link in your email to activate your account.
        </p>
      </div>

      {feedbackMsg && (
        <div className="rounded-lg border border-moss/40 bg-paper-deep p-3 text-xs text-ink font-medium animate-in fade-in duration-200">
          {feedbackMsg}
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-rule">
        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="w-full rounded-lg border border-rule bg-paper px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-ink hover:border-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </button>
        )}

        <p className="text-xs text-ink-muted">
          Need to sign in with a different account?{" "}
          <Link
            href="/login"
            className="text-ink hover:text-moss underline underline-offset-4 font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
