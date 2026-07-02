import { useEffect, useState } from "react";
import { api } from "../api";
import { CONTACT_STATUSES, STATUS_LABELS } from "../constants";
import type { Contact, ContactInput, Organization } from "../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/ui";

export function ContactForm({
  open,
  record,
  onClose,
  onSaved,
  organizations,
}: {
  open: boolean;
  record?: Contact | null;
  onClose: () => void;
  onSaved: () => void;
  organizations: Organization[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [status, setStatus] = useState("lead");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(record?.name ?? "");
      setEmail(record?.email ?? "");
      setPhone(record?.phone ?? "");
      setJobTitle(record?.job_title ?? "");
      setOrgId(record?.organization_id ? String(record.organization_id) : "");
      setStatus(record?.status ?? "lead");
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
    const input: ContactInput = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      job_title: jobTitle.trim() || null,
      organization_id: orgId ? Number(orgId) : null,
      status,
    };
    try {
      if (record) await api.contacts.update(record.id, input);
      else await api.contacts.create(input);
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
      title={record ? "Edit contact" : "Add contact"}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : record ? "Save changes" : "Add contact"}
          </button>
        </>
      }
    >
      <div className="field-row">
        <Field label="Name" required error={error ?? undefined}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>
        <Field label="Job title">
          <input
            className="input"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="VP of Sales"
          />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Email">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
          />
        </Field>
        <Field label="Phone">
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 010-0000"
          />
        </Field>
      </div>
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
        <Field label="Status">
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}
