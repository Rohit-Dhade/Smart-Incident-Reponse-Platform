import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiAction } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Notice } from "../components/Feedback";
import { PasswordField } from "../components/FormField";
import { ArrowRightIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

// Reset tokens are 32 random bytes encoded as hex (64 characters).
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function ResetPasswordPage() {
  usePageTitle("Choose a new password");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const token = (searchParams.get("token") ?? "").trim();
  const hasValidToken = TOKEN_PATTERN.test(token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hasValidToken) {
    return (
      <AuthLayout>
        <div className="auth-form">
          <p className="eyebrow">Password reset</p>
          <h1 className="auth-form__title">This link is incomplete.</h1>
          <p className="auth-form__lede">
            The reset token is missing or malformed. Request a new link and try
            again.
          </p>

          <div className="auth-actions">
            <Link className="btn btn--primary" to="/forgot-password">
              Request a new link
            </Link>
            <Link className="btn btn--secondary" to="/login">
              Go to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
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
      const message = await apiAction(
        "/api/v1/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token, password }),
        },
        { suppressAuthEvent: true },
      );

      // The backend clears the auth cookie when the password changes.
      await refresh();

      navigate("/login", {
        replace: true,
        state: {
          notice:
            message ??
            "Password updated. Please log in with your new password.",
        },
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password.",
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
        <p className="eyebrow">Password reset</p>
        <h1 className="auth-form__title">Choose a new password.</h1>
        <p className="auth-form__lede">
          Pick a password with at least 6 characters. Resetting it will sign
          you out of any other sessions.
        </p>

        {serverError ? (
          <Notice tone="error" onDismiss={() => setServerError("")}>
            {serverError}
            {serverError.toLowerCase().includes("expired") ? (
              <>
                {" "}
                <Link to="/forgot-password">Request a new link</Link>.
              </>
            ) : null}
          </Notice>
        ) : null}

        <form
          className="form-stack"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={submitting}
        >
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={updateField(setPassword, "password")}
            error={fieldErrors.password}
            hint="Use at least 6 characters."
            autoFocus
            required
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={updateField(setConfirmPassword, "confirmPassword")}
            error={fieldErrors.confirmPassword}
            required
          />
          <button
            type="submit"
            className="btn btn--primary btn--wide"
            disabled={submitting}
          >
            {submitting ? "Updating password…" : "Update password"}
            {!submitting ? <ArrowRightIcon size={17} /> : null}
          </button>
        </form>

        <p className="auth-form__switch">
          Need a new link? <Link to="/forgot-password">Request one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
