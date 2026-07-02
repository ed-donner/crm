// Row shapes returned by the database and the input shapes accepted by the
// create/update endpoints. Kept in one place so the repository, routes and
// tests all agree on the contract.

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact_count?: number;
  deal_count?: number;
}

export interface OrganizationInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  notes?: string | null;
}

export interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  organization_name?: string | null;
}

export interface ContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  organization_id?: number | null;
  status?: string;
}

export interface Deal {
  id: number;
  name: string;
  organization_id: number | null;
  contact_id: number | null;
  stage: string;
  value: number;
  close_date: string | null;
  created_at: string;
  updated_at: string;
  organization_name?: string | null;
  contact_name?: string | null;
}

export interface DealInput {
  name: string;
  organization_id?: number | null;
  contact_id?: number | null;
  stage?: string;
  value?: number;
  close_date?: string | null;
}

export interface Activity {
  id: number;
  type: string;
  contact_id: number | null;
  deal_id: number | null;
  description: string;
  occurred_at: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
  contact_name?: string | null;
  deal_name?: string | null;
}

/** Raw activity row from SQLite (done stored as 0/1, not boolean). */
export type ActivityRow = Omit<Activity, "done"> & { done: number };

export interface ActivityInput {
  type?: string;
  contact_id?: number | null;
  deal_id?: number | null;
  description: string;
  occurred_at?: string;
  due_date?: string | null;
  done?: boolean;
}

export interface OrganizationDetail extends Organization {
  contacts: Contact[];
  deals: Deal[];
}

export interface DealDetail extends Deal {
  activities: Activity[];
}

export interface ContactDetail extends Contact {
  activities: Activity[];
}
