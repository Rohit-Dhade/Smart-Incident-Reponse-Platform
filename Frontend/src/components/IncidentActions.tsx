import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import {
  allowedTransitions,
  INCIDENT_STATUS_LABELS,
} from "../constants";
import type { Incident, IncidentStatus, UpdateVisibility } from "../types";
import { Notice } from "./Feedback";
import { SelectField, TextAreaField } from "./FormField";
import { ArrowRightIcon, MessageIcon, RefreshIcon } from "./Icons";

interface StatusUpdatePanelProps {
  incident: Incident;
  onUpdated: (incident: Incident) => void;
  onNotice: (message: string) => void;
}

export function StatusUpdatePanel({
  incident,
  onUpdated,
  onNotice,
}: StatusUpdatePanelProps) {
  const transitions = allowedTransitions(incident.status);
  const [nextStatus, setNextStatus] = useState<IncidentStatus>(
    transitions[0] ?? incident.status,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNextStatus(allowedTransitions(incident.status)[0] ?? incident.status);
    setNote("");
    setError("");
  }, [incident.status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (note.length > 500) {
      setError("Keep the status note to 500 characters or fewer.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<Incident>(
        `/api/v1/incidents/${incident._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            ...(note.trim() ? { note: note.trim() } : {}),
          }),
        },
      );
      setNote("");
      onUpdated(updated);
      onNotice(
        nextStatus === "resolved"
          ? "Incident resolved. The service status has been updated."
          : `Status moved to ${INCIDENT_STATUS_LABELS[nextStatus]}.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update the incident status.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel =
    nextStatus === "resolved"
      ? "Resolve incident"
      : incident.status === "resolved"
        ? "Reopen incident"
        : "Update status";

  return (
    <section className="panel side-panel" aria-labelledby="status-form-heading">
      <div className="side-panel__header">
        <span className="side-panel__icon" aria-hidden="true">
          <RefreshIcon size={18} />
        </span>
        <div>
          <h2 id="status-form-heading">Move the incident forward</h2>
          <p>Status changes are recorded on the timeline.</p>
        </div>
      </div>

      <form className="side-panel__body form-stack" onSubmit={handleSubmit}>
        {error ? (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        ) : null}

        <SelectField
          label="New status"
          name="status"
          value={nextStatus}
          onChange={(event) =>
            setNextStatus(event.target.value as IncidentStatus)
          }
          hint={
            incident.status === "resolved"
              ? "Reopening returns the incident to Investigating."
              : "Only valid next states are shown."
          }
        >
          {transitions.map((status) => (
            <option value={status} key={status}>
              {INCIDENT_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>

        <TextAreaField
          label="Status note"
          name="note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What changed? (optional)"
          hint="Internal only. Post a public update below to notify customers."
        />

        <button
          type="submit"
          className="btn btn--primary btn--wide"
          disabled={submitting}
        >
          {submitting ? "Updating…" : buttonLabel}
          {!submitting ? <ArrowRightIcon size={16} /> : null}
        </button>
      </form>
    </section>
  );
}

interface UpdateComposerProps {
  incidentId: string;
  onPosted: () => Promise<void> | void;
  onNotice: (message: string) => void;
}

export function UpdateComposer({
  incidentId,
  onPosted,
  onNotice,
}: UpdateComposerProps) {
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<UpdateVisibility>("internal");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Write an update before posting.");
      return;
    }
    if (message.length > 1000) {
      setError("Keep the update to 1000 characters or fewer.");
      return;
    }

    setSubmitting(true);
    try {
      await api(`/api/v1/incidents/${incidentId}/updates`, {
        method: "POST",
        body: JSON.stringify({
          message: message.trim(),
          visibility,
        }),
      });
      setMessage("");
      onNotice(
        visibility === "public"
          ? "Public update posted to the status page."
          : "Internal note added to the timeline.",
      );
      await onPosted();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to post the update.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel side-panel" aria-labelledby="update-form-heading">
      <div className="side-panel__header">
        <span className="side-panel__icon" aria-hidden="true">
          <MessageIcon size={18} />
        </span>
        <div>
          <h2 id="update-form-heading">Post an update</h2>
          <p>Keep the team and customers on the same page.</p>
        </div>
      </div>

      <form className="side-panel__body form-stack" onSubmit={handleSubmit}>
        {error ? (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        ) : null}

        <fieldset className="choice-fieldset">
          <legend className="field__label">Visibility</legend>
          <div className="choice-group">
            <label
              className={`choice ${
                visibility === "internal" ? "is-selected" : ""
              }`.trim()}
            >
              <input
                type="radio"
                name="visibility"
                value="internal"
                checked={visibility === "internal"}
                onChange={() => setVisibility("internal")}
              />
              <span>Internal note</span>
            </label>
            <label
              className={`choice ${
                visibility === "public" ? "is-selected" : ""
              }`.trim()}
            >
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
              />
              <span>Public update</span>
            </label>
          </div>
          <p className="field__message">
            {visibility === "public"
              ? "This update appears on the public status page immediately."
              : "Internal notes stay inside the workspace."}
          </p>
        </fieldset>

        <TextAreaField
          label="Update"
          name="message"
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            visibility === "public"
              ? "We have identified the cause and are rolling out a fix."
              : "Note for the response team"
          }
          hint={`${1000 - message.length} characters remaining`}
        />

        <button
          type="submit"
          className="btn btn--primary btn--wide"
          disabled={submitting}
        >
          {submitting
            ? "Posting…"
            : visibility === "public"
              ? "Post public update"
              : "Post internal note"}
        </button>
      </form>
    </section>
  );
}
