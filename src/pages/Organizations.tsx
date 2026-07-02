import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Organization } from "../types";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { OrganizationForm } from "../forms/OrganizationForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorBanner, Spinner } from "../components/ui";
import { PlusIcon, PencilIcon, TrashIcon, ExternalLinkIcon } from "../components/icons";

export default function Organizations() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  async function load() {
    setError(null);
    try {
      setOrgs(await api.organizations.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load organizations");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<Organization>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (o) => <span className="cell-primary">{o.name}</span>,
    },
    { key: "industry", header: "Industry", sortable: true, cell: (o) => o.industry ?? "—" },
    {
      key: "website",
      header: "Website",
      cell: (o) =>
        o.website ? (
          <span className="cell-muted" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
            {o.website} <ExternalLinkIcon size={12} />
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "contact_count",
      header: "Contacts",
      sortable: true,
      align: "center",
      cell: (o) => o.contact_count ?? 0,
    },
    {
      key: "deal_count",
      header: "Deals",
      sortable: true,
      align: "center",
      cell: (o) => o.deal_count ?? 0,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      searchable: false,
      cell: (o) => (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon"
            title="Edit"
            onClick={() => {
              setEditing(o);
              setFormOpen(true);
            }}
          >
            <PencilIcon size={15} />
          </button>
          <button className="btn-icon" title="Delete" onClick={() => setDeleting(o)}>
            <TrashIcon size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {orgs === null ? (
        <Spinner label="Loading organizations…" />
      ) : (
        <DataTable
          columns={columns}
          data={orgs}
          searchPlaceholder="Search organizations…"
          onRowClick={(o) => navigate(`/organizations/${o.id}`)}
          emptyTitle="No organizations yet"
          emptySub="Add your first organization to get started."
          toolbar={
            <button
              className="btn btn--primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <PlusIcon size={16} /> Add organization
            </button>
          }
        />
      )}

      <OrganizationForm
        open={formOpen}
        record={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete organization"
        message={`Delete “${deleting?.name}”? Its contacts and deals will be unlinked but kept.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await api.organizations.remove(deleting.id);
            setDeleting(null);
            load();
          }
        }}
      />
    </div>
  );
}
