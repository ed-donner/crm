import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { STATUS_LABELS } from "../constants";
import type { ContactDetail, Organization } from "../types";
import { ContactForm } from "../forms/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";
import { StatusBadge } from "../components/Badges";
import { BackLink, ErrorBanner, Spinner } from "../components/ui";
import { formatDate } from "../utils";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/icons";

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    if (!id) return;
    setError(null);
    try {
      const [c, o] = await Promise.all([api.contacts.get(Number(id)), api.organizations.list()]);
      setContact(c);
      setOrgs(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contact");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!contact) return <Spinner label="Loading contact…" />;

  return (
    <div>
      <BackLink to="/contacts" label="Contacts" />
      <div className="detail-header">
        <div>
          <h1 className="detail-header__title">{contact.name}</h1>
          <p className="detail-header__sub">
            {[contact.job_title, contact.organization_name].filter(Boolean).join(" · ") || "No title or organization"}
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn" onClick={() => setFormOpen(true)}>
            <PencilIcon size={15} /> Edit
          </button>
          <button className="btn btn--danger" onClick={() => setConfirmOpen(true)}>
            <TrashIcon size={15} /> Delete
          </button>
        </div>
      </div>

      <div className="detail-grid" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Activity timeline</h3>
            <button className="btn btn--sm btn--primary" onClick={() => setActivityOpen(true)}>
              <PlusIcon size={14} /> Log activity
            </button>
          </div>
          <div className="card__body card__body--flush" style={{ padding: "8px 18px" }}>
            <ActivityTimeline activities={contact.activities} onChanged={load} />
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Details</h3>
            <StatusBadge status={contact.status} />
          </div>
          <div className="card__body">
            <dl className="kv">
              <dt>Email</dt>
              <dd>{contact.email ?? "—"}</dd>
              <dt>Phone</dt>
              <dd>{contact.phone ?? "—"}</dd>
              <dt>Job title</dt>
              <dd>{contact.job_title ?? "—"}</dd>
              <dt>Organization</dt>
              <dd>
                {contact.organization_id ? (
                  <button className="link-row" onClick={() => navigate(`/organizations/${contact.organization_id}`)}>
                    {contact.organization_name}
                  </button>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Status</dt>
              <dd>{STATUS_LABELS[contact.status] ?? contact.status}</dd>
              <dt>Added</dt>
              <dd>{formatDate(contact.created_at)}</dd>
            </dl>
          </div>
        </div>
      </div>

      <ContactForm open={formOpen} record={contact} organizations={orgs} onClose={() => setFormOpen(false)} onSaved={load} />
      <ActivityForm
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        onSuccess={load}
        contactId={contact.id}
        subject={contact.name}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete contact"
        message={`Delete “${contact.name}”? This cannot be undone.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await api.contacts.remove(contact.id);
          navigate("/contacts");
        }}
      />
    </div>
  );
}
