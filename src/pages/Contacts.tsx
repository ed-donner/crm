import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { CONTACT_STATUSES, STATUS_LABELS } from "../constants";
import type { Contact, Organization } from "../types";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { ContactForm } from "../forms/ContactForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusBadge } from "../components/Badges";
import { ErrorBanner, Spinner } from "../components/ui";
import { PlusIcon, PencilIcon, TrashIcon } from "../components/icons";

type StatusFilter = "all" | (typeof CONTACT_STATUSES)[number];

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  async function load() {
    setError(null);
    try {
      const [c, o] = await Promise.all([api.contacts.list(), api.organizations.list()]);
      setContacts(c);
      setOrgs(o);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = contacts
    ? status === "all"
      ? contacts
      : contacts.filter((c) => c.status === status)
    : null;

  const columns: DataTableColumn<Contact>[] = [
    { key: "name", header: "Name", sortable: true, cell: (c) => <span className="cell-primary">{c.name}</span> },
    { key: "job_title", header: "Title", cell: (c) => c.job_title ?? "—" },
    { key: "email", header: "Email", cell: (c) => c.email ?? "—" },
    { key: "phone", header: "Phone", cell: (c) => c.phone ?? "—" },
    {
      key: "organization_name",
      header: "Organization",
      sortable: true,
      cell: (c) =>
        c.organization_id ? (
          <button
            className="link-row"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizations/${c.organization_id}`);
            }}
          >
            {c.organization_name}
          </button>
        ) : (
          "—"
        ),
    },
    { key: "status", header: "Status", sortable: true, cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      searchable: false,
      cell: (c) => (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn-icon" title="Edit" onClick={() => { setEditing(c); setFormOpen(true); }}>
            <PencilIcon size={15} />
          </button>
          <button className="btn-icon" title="Delete" onClick={() => setDeleting(c)}>
            <TrashIcon size={15} />
          </button>
        </div>
      ),
    },
  ];

  const filters: StatusFilter[] = ["all", ...CONTACT_STATUSES];

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {filtered === null ? (
        <Spinner label="Loading contacts…" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchPlaceholder="Search by name, email, phone…"
          onRowClick={(c) => navigate(`/contacts/${c.id}`)}
          emptyTitle="No contacts"
          emptySub={status === "all" ? "Add your first contact to get started." : `No contacts with status “${STATUS_LABELS[status]}”.`}
          toolbar={
            <>
              <div className="segmented" role="tablist" aria-label="Filter by status">
                {filters.map((f) => (
                  <button
                    key={f}
                    className={status === f ? "active" : ""}
                    onClick={() => setStatus(f)}
                  >
                    {f === "all" ? "All" : STATUS_LABELS[f]}
                  </button>
                ))}
              </div>
              <button className="btn btn--primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <PlusIcon size={16} /> Add contact
              </button>
            </>
          }
        />
      )}

      <ContactForm open={formOpen} record={editing} organizations={orgs} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete contact"
        message={`Delete “${deleting?.name}”? This cannot be undone.`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) {
            await api.contacts.remove(deleting.id);
            setDeleting(null);
            load();
          }
        }}
      />
    </div>
  );
}
