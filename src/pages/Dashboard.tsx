import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { AMBER, BLUE, GREEN, PURPLE } from "../constants";
import type { Dashboard as DashboardData } from "../types";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { ActivityTypeBadge } from "../components/Badges";
import { ErrorBanner, Money, Spinner } from "../components/ui";
import { formatDate, formatMonth, formatMoney, isOverdue } from "../utils";
import { ArrowRightIcon, MailIcon, NoteIcon, PhoneIcon } from "../components/icons";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await api.dashboard.get());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Spinner label="Loading dashboard…" />;

  // Trim leading empty months so the chart starts where data begins, while
  // always keeping the current (last) month.
  const allMonths = data.dealsWonByMonth;
  const firstIdx = allMonths.findIndex((m) => m.count > 0);
  const chartMonths = firstIdx === -1 ? allMonths : allMonths.slice(firstIdx);

  const overdueCount = data.tasks.filter((t) => isOverdue(t.due_date, t.done)).length;

  const stats = [
    { label: "Pipeline value", value: <Money value={data.totals.pipelineValue} />, hint: `${data.totals.openDeals} open deals`, color: BLUE },
    { label: "Revenue won", value: <Money value={data.totals.revenueWon} />, hint: `${data.totals.wonDeals} deals won`, color: GREEN },
    { label: "Won deals", value: data.totals.wonDeals, hint: `${data.totals.lostDeals} lost`, color: AMBER },
    { label: "Tasks due", value: data.tasks.length, hint: `${overdueCount} overdue`, color: PURPLE },
  ];

  return (
    <div>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className="stat__value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="stat__delta">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Deals won per month</h3>
          </div>
          <div className="card__body">
            <div className="chart-wrap" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMonths} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: "#9aa3af" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9aa3af" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} formatter={(v: number) => [`${v} won`, "Deals"]} labelFormatter={(l) => formatMonth(String(l))} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
                    {chartMonths.map((m) => (
                      <Cell key={m.month} fill={m.count > 0 ? AMBER : "#e3e6ea"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Revenue won per month</h3>
          </div>
          <div className="card__body">
            <div className="chart-wrap" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartMonths} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11, fill: "#9aa3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9aa3af" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [formatMoney(v), "Revenue"]} labelFormatter={(l) => formatMonth(String(l))} />
                  <Area type="monotone" dataKey="revenue" stroke={BLUE} strokeWidth={2} fill="url(#revFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 grid-2--even">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Recent activity</h3>
            <Link className="back-link" style={{ marginBottom: 0 }} to="/deals">
              View deals <ArrowRightIcon size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            {data.recentActivity.length === 0 ? (
              <p className="cell-muted" style={{ padding: 18 }}>No recent activity.</p>
            ) : (
              <ul className="list">
                {data.recentActivity.map((a) => (
                  <li className="list__item" key={a.id}>
                    <span className="feed__icon">{feedIcon(a.type)}</span>
                    <div className="feed__main">
                      <div className="feed__title">{a.description}</div>
                      <div className="feed__meta">
                        <ActivityTypeBadge type={a.type} />
                        {a.deal_name && <span>· {a.deal_name}</span>}
                        {a.contact_name && <span>· {a.contact_name}</span>}
                      </div>
                    </div>
                    <span className="feed__date">{formatDate(a.occurred_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Upcoming &amp; overdue tasks</h3>
          </div>
          <div className="card__body card__body--flush" style={{ padding: "8px 18px" }}>
            {data.tasks.length === 0 ? (
              <p className="cell-muted" style={{ padding: 18 }}>No upcoming tasks. You're all caught up.</p>
            ) : (
              <ActivityTimeline activities={data.tasks} onChanged={load} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function feedIcon(type: string) {
  if (type === "call") return <PhoneIcon size={15} />;
  if (type === "email") return <MailIcon size={15} />;
  return <NoteIcon size={15} />;
}
