export const STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export const CONTACT_STATUSES = ["lead", "qualified", "customer"] as const;
export const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  qualified: "Qualified",
  customer: "Customer",
};

export const ACTIVITY_TYPES = ["note", "call", "email"] as const;
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
};

export const AMBER = "#ecad0a";
export const BLUE = "#209dd7";
export const PURPLE = "#753991";
export const GREEN = "#1f9d55";
export const SLATE = "#64748b";
export const RED = "#d92d20";

export const STAGE_COLORS: Record<string, string> = {
  new: SLATE,
  qualified: BLUE,
  proposal: PURPLE,
  negotiation: AMBER,
  won: GREEN,
  lost: RED,
};
