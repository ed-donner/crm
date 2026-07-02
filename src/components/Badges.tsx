import { ACTIVITY_TYPE_LABELS, STATUS_LABELS, STAGE_LABELS } from "../constants";

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`badge badge--${stage}`}>
      <span className="badge-dot" />
      {STAGE_LABELS[stage] ?? stage}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ActivityTypeBadge({ type }: { type: string }) {
  return (
    <span className={`badge badge--${type}`}>{ACTIVITY_TYPE_LABELS[type] ?? type}</span>
  );
}
