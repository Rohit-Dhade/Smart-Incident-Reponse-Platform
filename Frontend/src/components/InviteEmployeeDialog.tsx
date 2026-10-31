import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { api } from "../api";
import { ROLE_LABELS } from "../constants";
import {
  normalizeCreatedInvitation,
  type CreatedInvitationResponse,
} from "../invitations";
import type { CreatedInvitation, Role } from "../types";
import { Dialog } from "./Dialog";
import { Notice } from "./Feedback";
import { SelectField, TextField } from "./FormField";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (invitation: CreatedInvitation) => void;
}

export function InviteEmployeeDialog({
  open,
  onClose,
  onCreated,
}: InviteEmployeeDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("responder");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("responder");
    setFieldErrors({});
    setServerError("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");

    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      window.requestAnimationFrame(() => {
        form
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setSubmitting(true);
    try {
      const invitation = await api<CreatedInvitationResponse>(
        "/api/v1/invitations",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim(), role }),
        },
      );
      onCreated(normalizeCreatedInvitation(invitation));
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to send the invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setFieldErrors((current) => {
      if (!current.email) return current;
      const next = { ...current };
      delete next.email;
      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite an employee"
      description="We'll email a one-time link that lets a teammate join your workspace with the role you choose."
    >
      <form
        className="form-stack"
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
      >
        {serverError ? (
          <Notice tone="error" onDismiss={() => setServerError("")}>
            {serverError}
          </Notice>
        ) : null}

        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={updateEmail}
          error={fieldErrors.email}
          autoFocus
          required
        />

        <SelectField
          label="Role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          hint="Responders manage incidents. Viewers have read-only access. Admins also manage services and teammates."
        >
          {(["responder", "viewer", "admin"] as const).map((option) => (
            <option value={option} key={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </SelectField>

        <div className="dialog__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? "Sending invitation…" : "Send invitation"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
