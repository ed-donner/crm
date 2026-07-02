import { useEffect, useState } from "react";
import { api } from "../api";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "../constants";
import { Modal } from "./Modal";
import { Field } from "./ui";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityForm({
  open,
  onClose,
  onSuccess,
  contactId,
  dealId,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contactId?: number;
  dealId?: number;
  subject?: string;
}) {
  const [type, setType] = useState("note");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType("note");
      setDescription("");
      setOccurredAt(today());
      setDueDate("");
      setDone(false);
      setError(null);
    }
  }, [open]);

  async function submit() {
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.activities.create({
        type,
        description: description.trim(),
        occurred_at: occurredAt,
        due_date: dueDate || null,
        done,
        contact_id: contactId ?? null,
        deal_id: dealId ?? null,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save activity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Log activity"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save activity"}
          </button>
        </>
      }
    >
      {subject && (
        <p style={{ marginTop: 0, color: "var(--text-muted)", fontSize: 13 }}>
          on <strong>{subject}</strong>
        </p>
      )}
      <div className="field-row">
        <Field label="Type">
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            className="input"
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Description" required error={error ?? undefined}>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened or needs to happen?"
          autoFocus
        />
      </Field>
      <div className="field-row">
        <Field label="Follow-up due date" hint="Makes this a task">
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <Field label="Task status">
          <label className="checkbox-row" style={{ paddingTop: 9 }}>
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
            />
            Mark as done
          </label>
        </Field>
      </div>
    </Modal>
  );
}
