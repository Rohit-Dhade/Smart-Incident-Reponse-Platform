import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Notice } from "../components/Feedback";
import { PasswordField, TextField } from "../components/FormField";
import { ArrowRightIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

interface AcceptInviteResult {
  name: string;
  email: string;
  role: string;
}

export function AcceptInvitePage() {
  usePageTitle("Accept invitation");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const token = (searchParams.get("token") ?? "").trim();
  const hasValidToken = token.length >= 32 && token.length <= 200;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hasValidToken) {
    return (
      <AuthLayout variant="register">
        <div className="auth-form">
          <p className="eyebrow">Invitation</p>
          <h1 className="auth-form__title">This link is incomplete.</h1>
          <p className="auth-form__lede">
            The invitation token is missing or malformed. Ask a workspace admin
            to send you a fresh invitation link.
          </p>

          <div className="auth-actions">
            <Link className="btn btn--primary" to="/login">
              Go to sign in
            </Link>
            <Link className="btn btn--secondary" to="/">
              Find a status page
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const validate = () => {
    const errors: Record<string, string> = {};
    const trimmedName = name.trim();

    if (trimmedName && trimmedName.length < 2) {
      errors.name = "Your name must be at least 2 characters.";
    } else if (trimmedName.length > 50) {
      errors.name = "Keep your name to 50 characters or fewer.";
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
      const body: { token: string; password: string; name?: string } = {
        token,
        password,
      };
      if (name.trim()) body.name = name.trim();

      await api<AcceptInviteResult>(
        "/api/v1/invitations/accept",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        { suppressAuthEvent: true },
      );

      const session = await refresh();
      if (!session) {
        setServerError(
          "The invitation was accepted, but we could not load your session. Please sign in.",
        );
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to accept this invitation.",
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
    <AuthLayout variant="register">
      <div className="auth-form">
        <p className="eyebrow">Join your team</p>
        <h1 className="auth-form__title">You&rsquo;re invited.</h1>
        <p className="auth-form__lede">
          Accept this invitation to join your team&rsquo;s StatusDesk
          workspace. The invitation is tied to the email address it was sent
          to.
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
            label="Your name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={updateField(setName, "name")}
            error={fieldErrors.name}
            hint="Required when creating a new account. Existing accounts can leave this blank."
            maxLength={50}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={updateField(setPassword, "password")}
            error={fieldErrors.password}
            hint="New accounts: choose at least 6 characters. Existing accounts: enter your current password."
            required
          />
          <button
            type="submit"
            className="btn btn--primary btn--wide"
            disabled={submitting}
          >
            {submitting ? "Joining workspace…" : "Join workspace"}
            {!submitting ? <ArrowRightIcon size={17} /> : null}
          </button>
        </form>

        <p className="auth-form__switch">
          Already have a StatusDesk account? Use your existing password above.
        </p>
      </div>
    </AuthLayout>
  );
}
