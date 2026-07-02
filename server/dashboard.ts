import { type DB } from "./db.js";
import { listActivities } from "./repositories.js";
import type { Activity, ActivityRow } from "./types.js";

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

const MONTHS_BACK = 12;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Build the rolling list of the last `n` months ending with the current month. */
function recentMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(monthKey(m));
  }
  return out;
}

export function getDashboard(db: DB): Dashboard {
  // Deals won grouped by close-date month.
  const wonRows = db
    .prepare(
      `SELECT strftime('%Y-%m', close_date) AS month, COUNT(*) AS count, COALESCE(SUM(value), 0) AS revenue
       FROM deals
       WHERE stage = 'won' AND close_date IS NOT NULL
       GROUP BY month`,
    )
    .all() as { month: string; count: number; revenue: number }[];

  const wonByMonth = new Map(wonRows.map((r) => [r.month, r]));
  const dealsWonByMonth: MonthPoint[] = recentMonths(MONTHS_BACK).map((month) => {
    const row = wonByMonth.get(month);
    return {
      month,
      count: row ? Number(row.count) : 0,
      revenue: row ? Number(row.revenue) : 0,
    };
  });

  // Recent activity feed (newest first) across all records.
  const recentActivity = listActivities(db).slice(0, 8);

  // Upcoming & overdue tasks: not done, with a due date, soonest first.
  const taskRows = db
    .prepare(
      `SELECT a.*, c.name AS contact_name, d.name AS deal_name
       FROM activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN deals d ON d.id = a.deal_id
       WHERE a.done = 0 AND a.due_date IS NOT NULL
       ORDER BY a.due_date ASC, a.created_at ASC
       LIMIT 50`,
    )
    .all() as ActivityRow[];
  const tasks: Activity[] = taskRows.map((r) => ({ ...r, done: Boolean(r.done) }));

  const totalsRow = db
    .prepare(
      `SELECT
         SUM(CASE WHEN stage NOT IN ('won','lost') THEN 1 ELSE 0 END) AS open_deals,
         SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END) AS won_deals,
         SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END) AS lost_deals,
         COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS pipeline_value,
         COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS revenue_won
       FROM deals`,
    )
    .get() as {
    open_deals: number;
    won_deals: number;
    lost_deals: number;
    pipeline_value: number;
    revenue_won: number;
  };

  return {
    dealsWonByMonth,
    recentActivity,
    tasks,
    totals: {
      openDeals: Number(totalsRow.open_deals) || 0,
      wonDeals: Number(totalsRow.won_deals) || 0,
      lostDeals: Number(totalsRow.lost_deals) || 0,
      pipelineValue: Number(totalsRow.pipeline_value) || 0,
      revenueWon: Number(totalsRow.revenue_won) || 0,
    },
  };
}
