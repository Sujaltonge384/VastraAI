"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Register.module.css";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/sign-up/email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to create your account."
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
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

          <h1>Create Account</h1>

          <p>
            Join VastraAI and discover your style
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="name"
            >
              Full Name
            </label>

            <input
              className={styles.input}
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="register-email"
            >
              Email Address
            </label>

            <input
              className={styles.input}
              id="register-email"
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
              htmlFor="register-password"
            >
              Password
            </label>

            <input
              className={styles.input}
              id="register-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              minLength={6}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor="confirm-password"
            >
              Confirm Password
            </label>

            <input
              className={styles.input}
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              minLength={6}
              required
              disabled={loading}
              autoComplete="new-password"
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
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{" "}
          <Link
            href="/login"
            className={styles.link}
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}