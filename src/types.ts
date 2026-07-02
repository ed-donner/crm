// Frontend types mirroring the API responses. Field names match the server
// (snake_case) so records can be used directly without transformation.

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

export interface OrganizationDetail extends Organization {
  contacts: Contact[];
  deals: Deal[];
}

export interface ContactDetail extends Contact {
  activities: Activity[];
}

export interface DealDetail extends Deal {
  activities: Activity[];
}

export interface MonthPoint {
  month: string; // YYYY-MM
  count: number;
  revenue: number;
}

export interface Dashboard {
  dealsWonByMonth: MonthPoint[];
  recentActivity: Activity[];
  tasks: Activity[];
  totals: {
    openDeals: number;
    wonDeals: number;
    lostDeals: number;
    pipelineValue: number;
    revenueWon: number;
  };
}

export interface OrganizationInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  notes?: string | null;
}

export interface ContactInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  organization_id?: number | null;
  status?: string;
}

export interface DealInput {
  name: string;
  organization_id?: number | null;
  contact_id?: number | null;
  stage?: string;
  value?: number;
  close_date?: string | null;
}

export interface ActivityInput {
  type?: string;
  contact_id?: number | null;
  deal_id?: number | null;
  description: string;
  occurred_at?: string;
  due_date?: string | null;
  done?: boolean;
}
