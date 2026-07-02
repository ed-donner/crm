import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Contact, Deal, Organization } from "../types";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { DealForm } from "../forms/DealForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StageBadge } from "../components/Badges";
import { ErrorBanner, Spinner } from "../components/ui";
import { formatDate, formatMoney } from "../utils";
import { PlusIcon, PencilIcon, TrashIcon } from "../components/icons";

export default function Deals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  async function load() {
    setError(null);
    try {
      const [d, o, c] = await Promise.all([
        api.deals.list(),
        api.organizations.list(),
        api.contacts.list(),
      ]);
      setDeals(d);
      setOrgs(o);
      setContacts(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deals");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<Deal>[] = [
    { key: "name", header: "Deal", sortable: true, cell: (d) => <span className="cell-primary">{d.name}</span> },
    {
      key: "organization_name",
      header: "Organization",
      sortable: true,
      cell: (d) =>
        d.organization_id ? (
          <button className="link-row" onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${d.organization_id}`); }}>
            {d.organization_name ?? "—"}
          </button>
        ) : (
          "—"
        ),
    },
    {
      key: "contact_name",
      header: "Contact",
      cell: (d) =>
        d.contact_id ? (
          <button className="link-row" onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${d.contact_id}`); }}>
            {d.contact_name ?? "—"}
          </button>
        ) : (
          "—"
        ),
    },
    { key: "stage", header: "Stage", sortable: true, cell: (d) => <StageBadge stage={d.stage} /> },
    {
      key: "value",
      header: "Value",
      align: "right",
      sortable: true,
      cell: (d) => <strong>{formatMoney(d.value)}</strong>,
    },
    { key: "close_date", header: "Close date", sortable: true, cell: (d) => formatDate(d.close_date) },
    {
      key: "actions",
      header: "",
      align: "right",
      searchable: false,
      cell: (d) => (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon" title="Edit" onClick={() => { setEditing(d); setFormOpen(true); }}>
            <PencilIcon size={15} />
          </button>
          <button className="btn-icon" title="Delete" onClick={() => setDeleting(d)}>
            <TrashIcon size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {deals === null ? (
        <Spinner label="Loading deals…" />
      ) : (
        <DataTable
          columns={columns}
          data={deals}
          searchPlaceholder="Search deals…"
          onRowClick={(d) => navigate(`/deals/${d.id}`)}
          emptyTitle="No deals yet"
          emptySub="Add your first deal to start tracking the pipeline."
          toolbar={
            <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <PlusIcon size={16} /> Add deal
            </button>
          }
        />
      )}

      <DealForm open={formOpen} record={editing} organizations={orgs} contacts={contacts} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete deal"
        message={`Delete “${deleting?.name}”? This cannot be undone.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await api.deals.remove(deleting.id);
            setDeleting(null);
            load();
          }
        }}
      />
    </div>
  );
}
