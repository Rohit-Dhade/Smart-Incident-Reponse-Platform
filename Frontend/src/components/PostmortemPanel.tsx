import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../api";
import { formatDateTime } from "../format";
import type { Incident, Postmortem } from "../types";
import { Notice } from "./Feedback";
import { TextAreaField } from "./FormField";
import {
  CheckCircleIcon,
  FileTextIcon,
  SparkleIcon,
} from "./Icons";

interface PostmortemPanelProps {
  incident: Incident;
  postmortem: Postmortem | null;
  canDraft: boolean;
  isAdmin: boolean;
  onChanged: (postmortem: Postmortem) => void;
  onNotice: (message: string) => void;
}

const SECTION_LIMIT = 2000;
const ACTION_ITEM_LIMIT = 300;
const MAX_ACTION_ITEMS = 20;

function Section({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="postmortem-section">
      <h3>{title}</h3>
      <p className={content ? "" : "is-empty"}>
        {content || "Not documented yet."}
      </p>
    </div>
  );
}

export function PostmortemPanel({
  incident,
  postmortem,
  canDraft,
  isAdmin,
  onChanged,
  onNotice,
}: PostmortemPanelProps) {
  const [error, setError] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState("");
  const [impact, setImpact] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [actionItemsText, setActionItemsText] = useState("");
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditingRef = useRef(false);

  useEffect(() => {
    if (editing) {
      wasEditingRef.current = true;
      document.getElementById("postmortem-summary")?.focus();
    } else if (wasEditingRef.current) {
      wasEditingRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [editing]);

  if (!postmortem && incident.status !== "resolved") {
    return null;
  }

  const handleDraft = async () => {
    setError("");
    setDrafting(true);
    try {
      const draft = await api<Postmortem>(
        `/api/v1/incidents/${incident._id}/postmortem/draft`,
        { method: "POST" },
      );
      onChanged(draft);
      onNotice("Postmortem draft generated from the incident timeline.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to generate the postmortem draft.",
      );
    } finally {
      setDrafting(false);
    }
  };

  const beginEdit = () => {
    if (!postmortem) return;
    setSummary(postmortem.summary);
    setImpact(postmortem.impact);
    setRootCause(postmortem.rootCause);
    setResolution(postmortem.resolution);
    setActionItemsText(postmortem.actionItems.join("\n"));
    setConfirmingPublish(false);
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const actionItems = actionItemsText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!summary.trim()) {
      setError("Add a summary before saving this draft.");
      document.getElementById("postmortem-summary")?.focus();
      return;
    }
    if (actionItems.length > MAX_ACTION_ITEMS) {
      setError(`Keep the list to ${MAX_ACTION_ITEMS} action items or fewer.`);
      return;
    }
    if (actionItems.some((item) => item.length > ACTION_ITEM_LIMIT)) {
      setError(
        `Keep each action item to ${ACTION_ITEM_LIMIT} characters or fewer.`,
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await api<Postmortem>(
        `/api/v1/incidents/${incident._id}/postmortem`,
        {
          method: "PATCH",
          body: JSON.stringify({
            summary: summary.trim(),
            impact: impact.trim(),
            rootCause: rootCause.trim(),
            resolution: resolution.trim(),
            actionItems,
          }),
        },
      );
      onChanged(updated);
      setEditing(false);
      onNotice("Postmortem draft updated.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update the postmortem draft.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setError("");
    setPublishing(true);
    try {
      const published = await api<Postmortem>(
        `/api/v1/incidents/${incident._id}/postmortem/publish`,
        { method: "POST" },
      );
      onChanged(published);
      setConfirmingPublish(false);
      onNotice("Postmortem published.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to publish the postmortem.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="panel postmortem" aria-labelledby="postmortem-heading">
      <div className="panel__header postmortem__header">
        <div className="postmortem__heading">
          <span className="postmortem__icon" aria-hidden="true">
            {postmortem ? <FileTextIcon size={20} /> : <SparkleIcon size={20} />}
          </span>
          <div>
            <p className="eyebrow">After the incident</p>
            <h2 id="postmortem-heading">Postmortem</h2>
          </div>
        </div>
        {postmortem ? (
          <span
            className={`pill pill--postmortem-${postmortem.status}`}
          >
            {postmortem.status === "published" ? "Published" : "Draft"}
          </span>
        ) : (
          <span className="pill pill--postmortem-draft">Not started</span>
        )}
      </div>

      <div className="postmortem__body">
        {error ? (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        ) : null}

        {!postmortem ? (
          <div className="postmortem__intro">
            <div>
              <h3>Turn the timeline into a written record.</h3>
              <p>
                Generate an AI-assisted draft from the incident, then review it
                before an admin publishes the final version.
              </p>
            </div>
            {canDraft ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleDraft}
                disabled={drafting}
              >
                <SparkleIcon size={16} />
                {drafting ? "Drafting…" : "Draft postmortem"}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="postmortem__meta">
              {postmortem.aiGenerated ? (
                <span>
                  AI-assisted
                  {postmortem.aiModel ? ` · ${postmortem.aiModel}` : ""}
                </span>
              ) : (
                <span>Written by the response team</span>
              )}
              {postmortem.approvedAt ? (
                <span>
                  Published {formatDateTime(postmortem.approvedAt)}
                </span>
              ) : (
                <span>Last updated {formatDateTime(postmortem.updatedAt)}</span>
              )}
            </div>

            {editing ? (
              <form
                className="postmortem__edit form-stack"
                onSubmit={handleSave}
                aria-busy={saving}
                noValidate
              >
                <p className="postmortem__edit-note">
                  Review and refine the generated draft. Published postmortems
                  are locked against further edits.
                </p>

                <TextAreaField
                  label="Summary"
                  name="summary"
                  id="postmortem-summary"
                  rows={4}
                  maxLength={SECTION_LIMIT}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  disabled={saving}
                  required
                />
                <TextAreaField
                  label="Impact"
                  name="impact"
                  rows={3}
                  maxLength={SECTION_LIMIT}
                  value={impact}
                  onChange={(event) => setImpact(event.target.value)}
                  disabled={saving}
                />
                <TextAreaField
                  label="Root cause"
                  name="rootCause"
                  rows={3}
                  maxLength={SECTION_LIMIT}
                  value={rootCause}
                  onChange={(event) => setRootCause(event.target.value)}
                  disabled={saving}
                />
                <TextAreaField
                  label="Resolution"
                  name="resolution"
                  rows={3}
                  maxLength={SECTION_LIMIT}
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  disabled={saving}
                />
                <TextAreaField
                  label="Action items"
                  name="actionItems"
                  rows={4}
                  value={actionItemsText}
                  onChange={(event) => setActionItemsText(event.target.value)}
                  hint="One action per line. Up to 20 items, 300 characters each."
                  disabled={saving}
                />

                <div className="postmortem__edit-actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={cancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save draft"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="postmortem__sections">
                  <Section title="Summary" content={postmortem.summary} />
                  <Section title="Impact" content={postmortem.impact} />
                  <Section title="Root cause" content={postmortem.rootCause} />
                  <Section title="Resolution" content={postmortem.resolution} />
                  <div className="postmortem-section">
                    <h3>Action items</h3>
                    {postmortem.actionItems.length > 0 ? (
                      <ul className="action-items">
                        {postmortem.actionItems.map((item, index) => (
                          <li key={`${item}-${index}`}>
                            <CheckCircleIcon size={16} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="is-empty">No action items recorded.</p>
                    )}
                  </div>
                </div>

                {postmortem.status === "draft" && canDraft ? (
                  <div className="postmortem__actions">
                    {confirmingPublish ? (
                      <div
                        className="confirm-bar"
                        role="group"
                        aria-label="Confirm publishing"
                      >
                        <span>
                          Publish this draft? Published postmortems are locked
                          against further edits.
                        </span>
                        <div>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => setConfirmingPublish(false)}
                            disabled={publishing}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={handlePublish}
                            disabled={publishing}
                          >
                            {publishing ? "Publishing…" : "Confirm publish"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="postmortem__action-row">
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={beginEdit}
                          ref={editButtonRef}
                        >
                          <FileTextIcon size={16} />
                          {postmortem.aiGenerated
                            ? "Edit AI draft"
                            : "Edit draft"}
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => setConfirmingPublish(true)}
                          >
                            Publish postmortem
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
