"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Не удалось войти");
        return;
      }
      router.replace("/app");
      router.refresh();
    } catch {
      setError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand" style={{ textDecoration: "none" }}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name" style={{ color: "var(--ink)" }}>
            касса
          </span>
        </Link>
        <p className="eyebrow">Вход</p>
        <h1>С возвращением</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <div className="auth-actions">
            <button className="btn btn-dark" type="submit" disabled={loading}>
              {loading ? "Входим..." : "Войти"}
            </button>
            <p className="auth-switch">
              Нет аккаунта? <Link href="/register">Регистрация</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
