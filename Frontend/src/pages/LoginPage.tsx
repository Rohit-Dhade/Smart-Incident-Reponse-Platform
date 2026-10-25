import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { request } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Notice } from "../components/Feedback";
import { PasswordField, TextField } from "../components/FormField";
import { ArrowRightIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  usePageTitle("Sign in");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fromState = (location.state as { from?: string } | null)?.from;
  const redirectTo = fromState?.startsWith("/") ? fromState : "/dashboard";

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");
    if (!validate()) {
      window.requestAnimationFrame(() => {
        form
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setSubmitting(true);
    try {
      await request<never>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const session = await refresh();
      if (!session) {
        setServerError(
          "Signed in, but we could not load your session. Please try again.",
        );
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateField =
    (setter: (value: string) => void, field: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    };

  return (
    <AuthLayout>
      <div className="auth-form">
        <p className="eyebrow">Sign in</p>
        <h1 className="auth-form__title">Welcome back.</h1>
        <p className="auth-form__lede">
          Sign in to your incident workspace and status page.
        </p>

        {serverError ? (
          <Notice tone="error" onDismiss={() => setServerError("")}>
            {serverError}
          </Notice>
        ) : null}

        <form
          className="form-stack"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={submitting}
        >
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={updateField(setEmail, "email")}
            error={fieldErrors.email}
            required
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={updateField(setPassword, "password")}
            error={fieldErrors.password}
            required
          />
          <button
            type="submit"
            className="btn btn--primary btn--wide"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
            {!submitting ? <ArrowRightIcon size={17} /> : null}
          </button>
        </form>

        <p className="auth-form__switch">
          New to StatusDesk? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
