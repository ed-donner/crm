import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { STAGE_LABELS } from "../constants";
import type { Contact, DealDetail, Organization } from "../types";
import { DealForm } from "../forms/DealForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityForm } from "../components/ActivityForm";
import { StageBadge } from "../components/Badges";
import { BackLink, ErrorBanner, Money, Spinner } from "../components/ui";
import { formatDate, formatMoney } from "../utils";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/icons";

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    if (!id) return;
    setError(null);
    try {
      const [d, o, c] = await Promise.all([
        api.deals.get(Number(id)),
        api.organizations.list(),
        api.contacts.list(),
      ]);
      setDeal(d);
      setOrgs(o);
      setContacts(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deal");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (error) return <ErrorBanner message={error} />;
  if (!deal) return <Spinner label="Loading deal…" />;

  return (
    <div>
      <BackLink to="/deals" label="Deals" />
      <div className="detail-header">
        <div>
          <h1 className="detail-header__title">{deal.name}</h1>
          <p className="detail-header__sub">
            {[deal.organization_name, deal.contact_name].filter(Boolean).join(" · ") || "No organization or contact"}
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
            <ActivityTimeline activities={deal.activities} onChanged={load} />
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Details</h3>
            <StageBadge stage={deal.stage} />
          </div>
          <div className="card__body">
            <dl className="kv">
              <dt>Value</dt>
              <dd><Money value={deal.value} /></dd>
              <dt>Stage</dt>
              <dd>{STAGE_LABELS[deal.stage] ?? deal.stage}</dd>
              <dt>Close date</dt>
              <dd>{formatDate(deal.close_date)}</dd>
              <dt>Organization</dt>
              <dd>
                {deal.organization_id ? (
                  <button className="link-row" onClick={() => navigate(`/organizations/${deal.organization_id}`)}>
                    {deal.organization_name}
                  </button>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Contact</dt>
              <dd>
                {deal.contact_id ? (
                  <button className="link-row" onClick={() => navigate(`/contacts/${deal.contact_id}`)}>
                    {deal.contact_name}
                  </button>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Created</dt>
              <dd>{formatDate(deal.created_at)}</dd>
            </dl>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Pipeline value
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{formatMoney(deal.value)}</div>
            </div>
          </div>
        </div>
      </div>

      <DealForm open={formOpen} record={deal} organizations={orgs} contacts={contacts} onClose={() => setFormOpen(false)} onSaved={load} />
      <ActivityForm
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        onSuccess={load}
        dealId={deal.id}
        subject={deal.name}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete deal"
        message={`Delete “${deal.name}”? This cannot be undone.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await api.deals.remove(deal.id);
          navigate("/deals");
        }}
      />
    </div>
  );
}
