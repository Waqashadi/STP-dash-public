"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      
      // In Next.js, redirect destinations from guards are typically passed via query parameters (e.g., /login?callbackUrl=/dashboard)
      const dest = searchParams.get("callbackUrl") || "/dashboard";
      router.replace(dest);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <Stethoscope size={18} />
          <span>Save The Patients</span>
        </div>
        <h1 className="login-title display">Admin login</h1>
        <p className="login-sub">Sign in to manage the treatment catalog.</p>

        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Username</label>
            <input
              className="input"
              style={{ paddingLeft: 12 }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              style={{ paddingLeft: 12 }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 8 }}>
            {loading && <Loader2 size={14} className="spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}