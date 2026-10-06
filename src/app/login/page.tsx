"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Invalid email or password."
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            VASTRAAI
          </div>

          <h1>Welcome Back</h1>

          <p>
            Sign in to continue shopping with
            VastraAI
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="login-email"
            >
              Email Address
            </label>

            <input
              className={styles.input}
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="login-password"
            >
              Password
            </label>

            <input
              className={styles.input}
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className={styles.error}>
              {error}
            </p>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          Don't have an account?{" "}
          <Link
            href="/register"
            className={styles.link}
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}