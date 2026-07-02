import { useState } from "react";
import type { Activity } from "../types";
import { api } from "../api";
import { ActivityTypeBadge } from "./Badges";
import { CheckIcon, TrashIcon } from "./icons";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(due: string | null, done: boolean): boolean {
  if (!due || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  return d < today;
}

export function ActivityTimeline({
  activities,
  onChanged,
}: {
  activities: Activity[];
  onChanged?: () => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggle(activity: Activity) {
    setBusyId(activity.id);
    try {
      await api.activities.setDone(activity.id, !activity.done);
      onChanged?.();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(activity: Activity) {
    setBusyId(activity.id);
    try {
      await api.activities.remove(activity.id);
      onChanged?.();
    } finally {
      setBusyId(null);
    }
  }

  if (activities.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "28px 12px" }}>
        <p className="empty-state__title">No activity yet</p>
        <p className="empty-state__sub">Log a note, call or email to start the timeline.</p>
      </div>
    );
  }

  return (
    <ul className="timeline">
      {activities.map((a) => {
        const overdue = isOverdue(a.due_date, a.done);
        return (
          <li className="timeline__item" key={a.id}>
            <button
              className={`check-toggle${a.done ? " check-toggle--checked" : ""}`}
              onClick={() => toggle(a)}
              disabled={busyId === a.id}
              title={a.done ? "Mark not done" : "Mark done"}
              aria-label={a.done ? "Mark not done" : "Mark done"}
            >
              {a.done && <CheckIcon size={14} />}
            </button>
            <div className="timeline__main">
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <ActivityTypeBadge type={a.type} />
                {a.due_date && (
                  <span className={`task-pill ${overdue ? "task-pill--overdue" : "task-pill--due"}`}>
                    {overdue ? "Overdue" : "Due"} {formatDate(a.due_date)}
                  </span>
                )}
              </div>
              <div className={`timeline__desc${a.done ? " timeline__desc--done" : ""}`}>
                {a.description}
              </div>
              <div className="timeline__meta">
                <span>{formatDate(a.occurred_at)}</span>
                {a.deal_name && <span>· Deal: {a.deal_name}</span>}
                {a.contact_name && <span>· Contact: {a.contact_name}</span>}
              </div>
            </div>
            <div className="timeline__actions">
              <button
                className="btn-icon"
                onClick={() => remove(a)}
                disabled={busyId === a.id}
                title="Delete activity"
                aria-label="Delete activity"
              >
                <TrashIcon size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
