import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Contact, Deal, OrganizationDetail } from "../types";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { OrganizationForm } from "../forms/OrganizationForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge, StageBadge } from "../components/Badges";
import { BackLink, ErrorBanner, Money, Spinner } from "../components/ui";
import { formatDate, formatMoney } from "../utils";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/icons";

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    if (!id) return;
    setError(null);
    try {
      setOrg(await api.organizations.get(Number(id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organization");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const contactColumns: DataTableColumn<Contact>[] = [
    { key: "name", header: "Name", sortable: true, cell: (c) => <span className="cell-primary">{c.name}</span> },
    { key: "job_title", header: "Title", cell: (c) => c.job_title ?? "—" },
    { key: "email", header: "Email", cell: (c) => c.email ?? "—" },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  ];

  const dealColumns: DataTableColumn<Deal>[] = [
    { key: "name", header: "Deal", sortable: true, cell: (d) => <span className="cell-primary">{d.name}</span> },
    { key: "stage", header: "Stage", cell: (d) => <StageBadge stage={d.stage} /> },
    {
      key: "value",
      header: "Value",
      align: "right",
      sortable: true,
      cell: (d) => <strong>{formatMoney(d.value)}</strong>,
    },
    { key: "close_date", header: "Close", cell: (d) => formatDate(d.close_date) },
  ];

  if (error) return <ErrorBanner message={error} />;
  if (!org) return <Spinner label="Loading organization…" />;

  return (
    <div>
      <BackLink to="/organizations" label="Organizations" />
      <div className="detail-header">
        <div>
          <h1 className="detail-header__title">{org.name}</h1>
          <p className="detail-header__sub">
            {[org.industry, org.website].filter(Boolean).join(" · ") || "No industry or website set"}
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

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Overview</h3>
          </div>
          <div className="card__body">
            <dl className="kv">
              <dt>Industry</dt>
              <dd>{org.industry ?? "—"}</dd>
              <dt>Website</dt>
              <dd>{org.website ?? "—"}</dd>
              <dt>Added</dt>
              <dd>{formatDate(org.created_at)}</dd>
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Notes</h3>
          </div>
          <div className="card__body">
            {org.notes ? <div className="notes-box">{org.notes}</div> : <span className="cell-muted">No notes.</span>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card__header">
          <h3 className="card__title">Contacts ({org.contacts.length})</h3>
          <button className="btn btn--sm" onClick={() => navigate("/contacts")}>
            <PlusIcon size={14} /> Add contact
          </button>
        </div>
        <div className="card__body card__body--flush">
          {org.contacts.length ? (
            <DataTable
              columns={contactColumns}
              data={org.contacts}
              onRowClick={(c) => navigate(`/contacts/${c.id}`)}
              searchPlaceholder="Search contacts…"
              emptyTitle="No contacts"
            />
          ) : (
            <p className="cell-muted" style={{ padding: 18 }}>
              No contacts at this organization yet.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Deals ({org.deals.length})</h3>
        </div>
        <div className="card__body card__body--flush">
          {org.deals.length ? (
            <DataTable
              columns={dealColumns}
              data={org.deals}
              onRowClick={(d) => navigate(`/deals/${d.id}`)}
              searchPlaceholder="Search deals…"
              emptyTitle="No deals"
            />
          ) : (
            <p className="cell-muted" style={{ padding: 18 }}>
              No deals with this organization yet.
            </p>
          )}
        </div>
      </div>

      <OrganizationForm open={formOpen} record={org} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete organization"
        message={`Delete “${org.name}”? This cannot be undone.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await api.organizations.remove(org.id);
          navigate("/organizations");
        }}
      />
    </div>
  );
}
