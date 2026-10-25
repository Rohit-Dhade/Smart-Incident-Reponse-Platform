import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../api";
import { INCIDENT_SEVERITY_LABELS } from "../constants";
import type { Incident, IncidentSeverity, Service } from "../types";
import { Dialog } from "./Dialog";
import { Notice } from "./Feedback";
import { SelectField, TextAreaField, TextField } from "./FormField";

interface CreateIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  services: Service[];
  onCreated: (incident: Incident) => void;
}

const SEVERITIES: IncidentSeverity[] = ["critical", "high", "medium", "low"];

export function CreateIncidentDialog({
  open,
  onClose,
  services,
  onCreated,
}: CreateIncidentDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [serviceId, setServiceId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTitle("");
      setDescription("");
      setSeverity("high");
      setServiceId(services[0]?._id ?? "");
      setFieldErrors({});
      setServerError("");
      setSubmitting(false);
    }
    wasOpenRef.current = open;
  }, [open, services]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setServerError("");

    const errors: Record<string, string> = {};
    if (!title.trim()) {
      errors.title = "A title is required.";
    } else if (title.trim().length > 120) {
      errors.title = "Keep the title to 120 characters or fewer.";
    }
    if (description.length > 2000) {
      errors.description = "Keep the description to 2000 characters or fewer.";
    }
    if (!serviceId) {
      errors.serviceId = "Choose the affected service.";
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
      const incident = await api<Incident>("/api/v1/incidents", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          severity,
          serviceId,
        }),
      });
      onCreated(incident);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Unable to open the incident.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Open an incident"
      description="Declare the impact, choose the affected service, and start the response timeline."
    >
      {services.length === 0 ? (
        <Notice tone="info">
          Add a service before opening an incident. Services can be added from
          the dashboard.
        </Notice>
      ) : (
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {serverError ? (
            <Notice tone="error" onDismiss={() => setServerError("")}>
              {serverError}
            </Notice>
          ) : null}

          <TextField
            label="Incident title"
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (fieldErrors.title) {
                setFieldErrors((current) => ({ ...current, title: "" }));
              }
            }}
            placeholder="Checkout API returning 5xx errors"
            maxLength={120}
            error={fieldErrors.title}
            autoFocus
            required
          />

          <div className="form-grid">
            <SelectField
              label="Affected service"
              name="serviceId"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              error={fieldErrors.serviceId}
              required
            >
              {services.map((service) => (
                <option value={service._id} key={service._id}>
                  {service.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Severity"
              name="severity"
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value as IncidentSeverity)
              }
              hint="Critical incidents are surfaced first on the dashboard."
            >
              {SEVERITIES.map((value) => (
                <option value={value} key={value}>
                  {INCIDENT_SEVERITY_LABELS[value]}
                </option>
              ))}
            </SelectField>
          </div>

          <TextAreaField
            label="Description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What are customers seeing? What do you know so far?"
            rows={5}
            maxLength={2000}
            hint={`Optional · ${2000 - description.length} characters remaining`}
            error={fieldErrors.description}
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
              {submitting ? "Opening incident…" : "Open incident"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
