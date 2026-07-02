import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { STAGES, STAGE_LABELS } from "../constants";
import type { Contact, Deal, DealInput, Organization } from "../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/ui";

export function DealForm({
  open,
  record,
  onClose,
  onSaved,
  organizations,
  contacts,
}: {
  open: boolean;
  record?: Deal | null;
  onClose: () => void;
  onSaved: () => void;
  organizations: Organization[];
  contacts: Contact[];
}) {
  const [name, setName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [contactId, setContactId] = useState("");
  const [stage, setStage] = useState("new");
  const [value, setValue] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(record?.name ?? "");
      setOrgId(record?.organization_id ? String(record.organization_id) : "");
      setContactId(record?.contact_id ? String(record.contact_id) : "");
      setStage(record?.stage ?? "new");
      setValue(record ? String(record.value ?? 0) : "");
      setCloseDate(record?.close_date ?? "");
      setError(null);
    }
  }, [open, record]);

  const orgIdNum = orgId ? Number(orgId) : null;
  const visibleContacts = useMemo(
    () => (orgIdNum ? contacts.filter((c) => c.organization_id === orgIdNum) : contacts),
    [contacts, orgIdNum],
  );

  // If the selected contact is not in the filtered set, clear it.
  useEffect(() => {
    if (contactId && !visibleContacts.some((c) => String(c.id) === contactId)) {
      setContactId("");
    }
  }, [visibleContacts, contactId]);

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const input: DealInput = {
      name: name.trim(),
      organization_id: orgId ? Number(orgId) : null,
      contact_id: contactId ? Number(contactId) : null,
      stage,
      value: value === "" ? 0 : Number(value),
      close_date: closeDate || null,
    };
    try {
      if (record) await api.deals.update(record.id, input);
      else await api.deals.create(input);
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
      title={record ? "Edit deal" : "Add deal"}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : record ? "Save changes" : "Add deal"}
          </button>
        </>
      }
    >
      <Field label="Deal name" required error={error ?? undefined}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Annual platform license"
          autoFocus
        />
      </Field>
      <div className="field-row">
        <Field label="Organization">
          <select className="select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">— None —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Primary contact" hint={orgId ? "Filtered to organization" : undefined}>
          <select
            className="select"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={visibleContacts.length === 0}
          >
            <option value="">— None —</option>
            {visibleContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="field-row">
        <Field label="Stage">
          <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Value (USD)">
          <input
            className="input"
            type="number"
            min="0"
            step="100"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      <Field label="Close date">
        <input
          className="input"
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
        />
      </Field>
    </Modal>
  );
}
