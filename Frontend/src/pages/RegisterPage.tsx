import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../api";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Notice } from "../components/Feedback";
import { PasswordField, TextField } from "../components/FormField";
import { ArrowRightIcon } from "../components/Icons";
import { slugify } from "../format";
import { usePageTitle } from "../hooks/usePageTitle";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[a-zA-Z0-9\s&.'-]+$/;

interface RegisterResponse {
  name: string;
  email: string;
  message: string;
}

export function RegisterPage() {
  usePageTitle("Create workspace");
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slugPreview = slugify(organizationName);

  const validate = () => {
    const errors: Record<string, string> = {};
    const org = organizationName.trim();
    const personName = name.trim();

    if (!org) {
      errors.organizationName = "Organization name is required.";
    } else if (org.length < 3 || org.length > 30) {
      errors.organizationName =
        "Organization name must be between 3 and 30 characters.";
    } else if (!NAME_PATTERN.test(org)) {
      errors.organizationName =
        "Use letters, numbers, spaces, and basic punctuation only.";
    }

    if (!personName) {
      errors.name = "Your name is required.";
    } else if (personName.length < 3 || personName.length > 30) {
      errors.name = "Your name must be between 3 and 30 characters.";
    } else if (!NAME_PATTERN.test(personName)) {
      errors.name = "Use letters, numbers, spaces, and basic punctuation only.";
    }

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
      await request<RegisterResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const session = await refresh();
      if (!session) {
        setServerError(
          "Workspace created, but we could not load your session. Please sign in.",
        );
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to create your workspace.",
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
        <p className="eyebrow">Create account</p>
        <h1 className="auth-form__title">Set up your workspace.</h1>
        <p className="auth-form__lede">
          Start with an incident workspace and a public status page for your
          organization.
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
            label="Organization name"
            name="organizationName"
            autoComplete="organization"
            placeholder="Acme Systems"
            value={organizationName}
            onChange={updateField(setOrganizationName, "organizationName")}
            error={fieldErrors.organizationName}
            hint={
              slugPreview
                ? `Public page: /status/${slugPreview}`
                : "Your public status page is created automatically."
            }
            required
          />
          <TextField
            label="Your name"
            name="name"
            autoComplete="name"
            placeholder="Rohit Dhade"
            value={name}
            onChange={updateField(setName, "name")}
            error={fieldErrors.name}
            required
          />
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
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={updateField(setPassword, "password")}
            error={fieldErrors.password}
            hint="Use at least 6 characters."
            required
          />
          <button
            type="submit"
            className="btn btn--primary btn--wide"
            disabled={submitting}
          >
            {submitting ? "Creating workspace…" : "Create workspace"}
            {!submitting ? <ArrowRightIcon size={17} /> : null}
          </button>
        </form>

        <p className="auth-form__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
