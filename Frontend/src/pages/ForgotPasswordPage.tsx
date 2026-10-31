import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiAction } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { Notice } from "../components/Feedback";
import { TextField } from "../components/FormField";
import { ArrowLeftIcon, ArrowRightIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  usePageTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldError("Email is required.");
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Enter a valid email address.");
    } else {
      setFieldError("");
    }

    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      window.requestAnimationFrame(() => {
        form
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setSubmitting(true);
    try {
      const responseMessage = await apiAction(
        "/api/v1/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email: trimmedEmail }),
        },
        { suppressAuthEvent: true },
      );
      setMessage(
        responseMessage ??
          "If an account exists for that email, a reset link is on its way.",
      );
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to send the reset link.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (fieldError) setFieldError("");
  };

  if (message) {
    return (
      <AuthLayout>
        <div className="auth-form">
          <p className="eyebrow">Check your inbox</p>
          <h1 className="auth-form__title">Reset link sent.</h1>
          <p className="auth-form__lede">{message}</p>
          <p className="auth-form__lede">
            The link expires in 60 minutes. If you don&rsquo;t see the email,
            check your spam folder.
          </p>

          <div className="auth-actions">
            <Link className="btn btn--primary" to="/login">
              <ArrowLeftIcon size={16} />
              Back to sign in
            </Link>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setMessage("")}
            >
              Use a different email
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <p className="eyebrow">Password help</p>
        <h1 className="auth-form__title">Forgot your password?</h1>
        <p className="auth-form__lede">
          Enter the email you use for StatusDesk and we&rsquo;ll send you a link
          to choose a new password.
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
            onChange={updateEmail}
            error={fieldError}
            autoFocus
            required
          />
          <button
            type="submit"
            className="btn btn--primary btn--wide"
            disabled={submitting}
          >
            {submitting ? "Sending reset link…" : "Send reset link"}
            {!submitting ? <ArrowRightIcon size={17} /> : null}
          </button>
        </form>

        <p className="auth-form__switch">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
