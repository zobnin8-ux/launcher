"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = createClient();

  function getCallbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo ?? "/admin")}`;
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: getCallbackUrl(),
      },
    });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    setStep("code");
    setMessage(
      "Code sent! Check your inbox and spam folder. Enter the 6-digit code below."
    );
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setIsError(true);
      setMessage(error.message);
      return;
    }

    window.location.href = redirectTo ?? "/admin";
  }

  async function handleGoogle() {
    setLoading(true);
    setIsError(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getCallbackUrl(),
      },
    });
    if (error) {
      setLoading(false);
      setIsError(true);
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      {step === "email" ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="you@restaurant.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send login code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm text-gray-600">
            Code sent to <strong>{email}</strong>
          </p>
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage("");
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Use a different email
          </button>
        </form>
      )}

      {step === "email" && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Continue with Google
          </button>
        </>
      )}

      {message && (
        <p
          className={`text-sm text-center ${isError ? "text-red-600" : "text-gray-600"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
