import type {
  Activity,
  ActivityInput,
  Contact,
  ContactDetail,
  ContactInput,
  Dashboard,
  Deal,
  DealDetail,
  DealInput,
  Organization,
  OrganizationDetail,
  OrganizationInput,
} from "./types";

const BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = (data && data.error) || res.statusText || "Request failed";
    throw new ApiError(res.status, message);
  }
  return data as T;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&") : "";
}

export const api = {
  organizations: {
    list: (search?: string) => request<Organization[]>(`/organizations${qs({ search })}`),
    get: (id: number) => request<OrganizationDetail>(`/organizations/${id}`),
    create: (input: OrganizationInput) =>
      request<Organization>("/organizations", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: OrganizationInput) =>
      request<Organization>(`/organizations/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: number) => request<void>(`/organizations/${id}`, { method: "DELETE" }),
  },
  contacts: {
    list: (opts: { search?: string; status?: string } = {}) =>
      request<Contact[]>(`/contacts${qs(opts)}`),
    get: (id: number) => request<ContactDetail>(`/contacts/${id}`),
    create: (input: ContactInput) =>
      request<Contact>("/contacts", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: ContactInput) =>
      request<Contact>(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    remove: (id: number) => request<void>(`/contacts/${id}`, { method: "DELETE" }),
  },
  deals: {
    list: (search?: string) => request<Deal[]>(`/deals${qs({ search })}`),
    get: (id: number) => request<DealDetail>(`/deals/${id}`),
    create: (input: DealInput) =>
      request<Deal>("/deals", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: DealInput) =>
      request<Deal>(`/deals/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    setStage: (id: number, stage: string) =>
      request<Deal>(`/deals/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),
    remove: (id: number) => request<void>(`/deals/${id}`, { method: "DELETE" }),
  },
  activities: {
    list: (opts: { contactId?: number; dealId?: number } = {}) =>
      request<Activity[]>(
        `/activities${qs({
          contact_id: opts.contactId?.toString(),
          deal_id: opts.dealId?.toString(),
        })}`,
      ),
    create: (input: ActivityInput) =>
      request<Activity>("/activities", { method: "POST", body: JSON.stringify(input) }),
    update: (id: number, input: Partial<ActivityInput>) =>
      request<Activity>(`/activities/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    setDone: (id: number, done: boolean) =>
      request<Activity>(`/activities/${id}/done`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }),
    remove: (id: number) => request<void>(`/activities/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    get: () => request<Dashboard>("/dashboard"),
  },
};

export { ApiError };
