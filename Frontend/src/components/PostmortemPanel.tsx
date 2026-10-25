import { useState } from "react";
import { api } from "../api";
import { formatDateTime } from "../format";
import type { Incident, Postmortem } from "../types";
import { Notice } from "./Feedback";
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

            {isAdmin && postmortem.status === "draft" ? (
              <div className="postmortem__actions">
                {confirmingPublish ? (
                  <div className="confirm-bar" role="group" aria-label="Confirm publishing">
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
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setConfirmingPublish(true)}
                  >
                    Publish postmortem
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
