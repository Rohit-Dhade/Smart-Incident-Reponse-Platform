import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import type { Service } from "../types";
import { Dialog } from "./Dialog";
import { Notice } from "./Feedback";
import { TextField } from "./FormField";

interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (service: Service) => void;
}

export function AddServiceDialog({
  open,
  onClose,
  onCreated,
}: AddServiceDialogProps) {
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setFieldError("");
    setServerError("");
    setSubmitting(false);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");

    const focusInvalid = () => {
      window.requestAnimationFrame(() => {
        form
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
    };

    if (!name.trim()) {
      setFieldError("A service name is required.");
      focusInvalid();
      return;
    }
    if (name.trim().length > 60) {
      setFieldError("Keep the service name to 60 characters or fewer.");
      focusInvalid();
      return;
    }

    setSubmitting(true);
    try {
      const service = await api<Service>("/api/v1/services", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      onCreated(service);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to add the service.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add a service"
      description="Services appear on the public status page and can be attached to incidents."
    >
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        {serverError ? (
          <Notice tone="error" onDismiss={() => setServerError("")}>
            {serverError}
          </Notice>
        ) : null}

        <TextField
          label="Service name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (fieldError) setFieldError("");
          }}
          placeholder="API gateway"
          maxLength={60}
          error={fieldError}
          autoFocus
          required
        />

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
            {submitting ? "Adding service…" : "Add service"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
