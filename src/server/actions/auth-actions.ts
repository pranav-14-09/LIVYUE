"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  message?: string;
}

function checkSupabaseConfig(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return "Supabase credentials are missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.";
  }

  if (url.includes("placeholder-project") || key.includes(".placeholder")) {
    return "Supabase is currently configured with placeholder keys. Please update .env.local with your real Supabase project URL and publishable key.";
  }

  try {
    new URL(url);
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL in .env.local is not a valid URL format.";
  }

  return null;
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
  const name = (formData.get("name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !email.includes("@") || !email.includes(".")) {
    return { success: false, error: "Please provide a valid email address." };
  }

  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return {
          success: false,
          error: "An account with this email already exists. Please log in.",
        };
      }
      return { success: false, error: error.message };
    }

    // Check if email confirmation is required
    if (data?.user && !data.session) {
      return {
        success: true,
        requiresEmailVerification: true,
        message: "Please check your email to verify your LIVYUE account.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to reach authentication server.";
    console.error("Supabase signUp exception:", err);
    return {
      success: false,
      error: message.includes("fetch failed")
        ? "Unable to connect to Supabase authentication server. Please check your internet connection or verify your Supabase project status."
        : message,
    };
  }
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return {
          success: false,
          error: "Incorrect email or password. Please try again.",
        };
      }
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return {
          success: false,
          requiresEmailVerification: true,
          error: "Please verify your email address before logging in.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to sign in.";
    console.error("Supabase signIn exception:", err);
    return {
      success: false,
      error: message.includes("fetch failed")
        ? "Unable to connect to Supabase authentication server. Please check your network or project settings."
        : message,
    };
  }
}

export async function signOutAction(): Promise<void> {
  try {
    const configError = checkSupabaseConfig();
    if (!configError) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.error("SignOut error:", err);
  }
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error("Password reset error:", error);
    }
  } catch (err) {
    console.error("ForgotPassword exception:", err);
  }

  return {
    success: true,
    message:
      "If an account with that email exists, we've sent a link to reset your password.",
  };
}

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Your password has been securely updated." };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to update password.";
    return { success: false, error: message };
  }
}

export async function resendVerificationAction(email: string): Promise<AuthActionResult> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const configError = checkSupabaseConfig();
  if (configError) {
    return { success: false, error: configError };
  }

  try {
    const supabase = await createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "A fresh verification link has been sent to your email.",
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to resend verification.";
    return { success: false, error: message };
  }
}
