import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { getInitials } from "../format";
import { ROLE_LABELS } from "../constants";
import type {
  AssignmentMember,
  Incident,
  IncidentAssignees,
} from "../types";
import { Notice } from "./Feedback";
import { PlusIcon, UsersIcon } from "./Icons";
import { SelectField } from "./FormField";

interface AssignmentPanelProps {
  incident: Incident;
  onUpdated: (incident: Incident) => void;
  onNotice: (message: string) => void;
}

export function AssignmentPanel({
  incident,
  onUpdated,
  onNotice,
}: AssignmentPanelProps) {
  const [assignees, setAssignees] = useState<IncidentAssignees | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const assignedKey = incident.assignedTo.join(",");

  const loadAssignees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<IncidentAssignees>(
        `/api/v1/incidents/${incident._id}/assignees`,
      );
      setAssignees(data);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `Could not load the response team: ${cause.message}`
          : "Could not load the response team.",
      );
    } finally {
      setLoading(false);
    }
  }, [incident._id]);

  useEffect(() => {
    void loadAssignees();
  }, [loadAssignees, assignedKey]);

  useEffect(() => {
    if (!assignees) return;
    setSelectedUserId((current) =>
      assignees.available.some((member) => member.id === current)
        ? current
        : (assignees.available[0]?.id ?? ""),
    );
  }, [assignees]);

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) {
      setError("Choose a responder to assign.");
      return;
    }

    const member = assignees?.available.find(
      (candidate) => candidate.id === selectedUserId,
    );

    setError("");
    setAssigning(true);
    try {
      const updated = await api<Incident>(
        `/api/v1/incidents/${incident._id}/assign`,
        {
          method: "POST",
          body: JSON.stringify({ userId: selectedUserId }),
        },
      );
      onUpdated(updated);
      onNotice(
        `${member?.name ?? "The responder"} was assigned to this incident.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to assign this responder.",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (member: AssignmentMember) => {
    setError("");
    setRemovingId(member.id);
    try {
      const updated = await api<Incident>(
        `/api/v1/incidents/${incident._id}/assign/${member.id}`,
        { method: "DELETE" },
      );
      onUpdated(updated);
      onNotice(`${member.name} was unassigned from this incident.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to unassign this responder.",
      );
    } finally {
      setRemovingId("");
    }
  };

  return (
    <section
      className="panel side-panel assignment-panel"
      aria-labelledby="assignment-heading"
    >
      <div className="side-panel__header">
        <span className="side-panel__icon" aria-hidden="true">
          <UsersIcon size={18} />
        </span>
        <div>
          <h2 id="assignment-heading">Responders</h2>
          <p>Assign the people working this incident.</p>
        </div>
      </div>

      <div className="side-panel__body">
        {error ? (
          <Notice tone="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        ) : null}

        {loading && !assignees ? (
          <p className="assignment-loading" role="status">
            Loading the response team…
          </p>
        ) : assignees ? (
          <>
            {assignees.assigned.length > 0 ? (
              <ul className="assignee-list" aria-label="Assigned responders">
                {assignees.assigned.map((member) => (
                  <li className="assignee" key={member.id}>
                    <span className="avatar assignee__avatar" aria-hidden="true">
                      {getInitials(member.name)}
                    </span>
                    <div className="assignee__body">
                      <span className="assignee__name">{member.name}</span>
                      <span className="assignee__meta">
                        {ROLE_LABELS[member.role]} · {member.email}
                      </span>
                    </div>
                    {assignees.canAssign ? (
                      <button
                        type="button"
                        className="btn btn--quiet btn--sm assignee__remove"
                        onClick={() => void handleUnassign(member)}
                        disabled={Boolean(removingId) || assigning}
                        aria-label={`Unassign ${member.name}`}
                      >
                        {removingId === member.id ? "Removing…" : "Unassign"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="assignment-empty">
                No one is assigned to this incident yet.
              </p>
            )}

            {assignees.canAssign ? (
              assignees.available.length > 0 ? (
                <form className="assignment-form" onSubmit={handleAssign}>
                  <SelectField
                    label="Assign a responder"
                    name="assignee"
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    hint="Admins and responders can be assigned."
                  >
                    {assignees.available.map((member) => (
                      <option value={member.id} key={member.id}>
                        {member.name} · {ROLE_LABELS[member.role]}
                      </option>
                    ))}
                  </SelectField>

                  <button
                    type="submit"
                    className="btn btn--secondary btn--wide"
                    disabled={assigning || !selectedUserId}
                  >
                    <PlusIcon size={15} />
                    {assigning ? "Assigning…" : "Assign responder"}
                  </button>
                </form>
              ) : (
                <p className="assignment-note">
                  Everyone who can respond is already assigned.
                </p>
              )
            ) : (
              <p className="assignment-note">
                Reopen the incident to change responder assignments.
              </p>
            )}
          </>
        ) : (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => void loadAssignees()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Try again"}
          </button>
        )}
      </div>
    </section>
  );
}
