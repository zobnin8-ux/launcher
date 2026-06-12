"use client";

import { useEffect, useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [configOk, setConfigOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => setConfigOk(data.ok === true && !data.wrongKey))
      .catch(() => setConfigOk(false));
  }, []);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to send code");
        return;
      }

      setStep("code");
      setMessage("Code sent! Check inbox AND spam folder.");
    } catch {
      setIsError(true);
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Invalid code");
        return;
      }

      window.location.href = redirectTo ?? "/admin";
    } catch {
      setIsError(true);
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {configOk === false && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Supabase not configured correctly. Open{" "}
          <a href="/api/auth/check" className="underline" target="_blank">
            /api/auth/check
          </a>{" "}
          to see details. Fix keys in Vercel and Redeploy.
        </div>
      )}

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
              placeholder="you@gmail.com"
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
              6-digit code from email
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
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
            ← Different email
          </button>
        </form>
      )}

      {message && (
        <p
          className={`text-sm text-center font-medium ${isError ? "text-red-600" : "text-green-700"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
