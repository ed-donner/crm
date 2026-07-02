import { useEffect, useState } from "react";
import { api } from "../api";
import type { Organization, OrganizationInput } from "../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/ui";

export function OrganizationForm({
  open,
  record,
  onClose,
  onSaved,
}: {
  open: boolean;
  record?: Organization | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(record?.name ?? "");
      setWebsite(record?.website ?? "");
      setIndustry(record?.industry ?? "");
      setNotes(record?.notes ?? "");
      setError(null);
    }
  }, [open, record]);

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const input: OrganizationInput = {
      name: name.trim(),
      website: website.trim() || null,
      industry: industry.trim() || null,
      notes: notes.trim() || null,
    };
    try {
      if (record) await api.organizations.update(record.id, input);
      else await api.organizations.create(input);
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={record ? "Edit organization" : "Add organization"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : record ? "Save changes" : "Add organization"}
          </button>
        </>
      }
    >
      <Field label="Name" required error={error ?? undefined}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          autoFocus
        />
      </Field>
      <div className="field-row">
        <Field label="Website">
          <input
            className="input"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="acme.com"
          />
        </Field>
        <Field label="Industry">
          <input
            className="input"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Manufacturing"
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything useful to remember about this organization…"
        />
      </Field>
    </Modal>
  );
}
