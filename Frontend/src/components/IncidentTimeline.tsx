import type { IncidentUpdate } from "../types";
import { UPDATE_TYPE_LABELS } from "../constants";
import { formatDateTime } from "../format";
import {
  ActivityIcon,
  ArrowRightIcon,
  MessageIcon,
  RefreshIcon,
  UsersIcon,
} from "./Icons";
import {
  IncidentStatusBadge,
  VisibilityBadge,
} from "./Pills";

function TimelineMarker({ type }: { type: IncidentUpdate["type"] }) {
  if (type === "status_change") return <RefreshIcon size={15} />;
  if (type === "assigned" || type === "unassigned")
    return <UsersIcon size={15} />;
  if (type === "note") return <MessageIcon size={15} />;
  return <ActivityIcon size={15} />;
}

export function IncidentTimeline({ updates }: { updates: IncidentUpdate[] }) {
  if (updates.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No timeline entries yet.</p>
      </div>
    );
  }

  return (
    <ol className="timeline" aria-label="Incident timeline">
      {updates.map((update) => (
        <li
          className={`timeline__item timeline__item--${update.type}`}
          key={update.id}
        >
          <span className="timeline__marker" aria-hidden="true">
            <TimelineMarker type={update.type} />
          </span>
          <div className="timeline__content">
            <div className="timeline__head">
              <span className="timeline__author">{update.author.name}</span>
              <span className="timeline__type">
                {UPDATE_TYPE_LABELS[update.type]}
              </span>
              {update.type === "note" ? (
                <VisibilityBadge visibility={update.visibility} />
              ) : null}
              <time
                className="timeline__time"
                dateTime={update.createdAt}
                title={formatDateTime(update.createdAt)}
              >
                {formatDateTime(update.createdAt)}
              </time>
            </div>

            <p className="timeline__message">{update.message}</p>

            {update.fromStatus && update.toStatus ? (
              <div className="timeline__status-change">
                <IncidentStatusBadge status={update.fromStatus} />
                <ArrowRightIcon size={14} />
                <IncidentStatusBadge status={update.toStatus} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
