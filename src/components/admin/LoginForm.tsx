"use client";

import { useEffect, useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
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

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    setSent(false);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: redirectTo ?? "/admin" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Failed to send email");
        return;
      }

      setSent(true);
      setMessage("");
    } catch {
      setIsError(true);
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📧</div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-gray-600">
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-600">
          Open the email and <strong>click the link</strong> to sign in.
          <br />
          Also check your <strong>Spam</strong> folder.
        </p>
        <p className="text-xs text-gray-400">
          No code needed — just click the link in the email.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setMessage("");
          }}
          className="text-sm text-orange-600 hover:underline"
        >
          ← Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {configOk === false && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Supabase not configured. Check{" "}
          <a href="/api/auth/check" className="underline" target="_blank">
            /api/auth/check
          </a>{" "}
          and fix keys in Vercel.
        </div>
      )}

      <form onSubmit={handleSendLink} className="space-y-4">
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
          {loading ? "Sending…" : "Send sign-in link"}
        </button>
      </form>

      {message && (
        <p className={`text-sm text-center font-medium ${isError ? "text-red-600" : "text-green-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
