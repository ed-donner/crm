import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "./icons";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="loading-row">
      <span className="spinner" style={{ verticalAlign: "-3px" }} /> {label ?? "Loading…"}
    </div>
  );
}

export function EmptyState({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {sub && <p className="empty-state__sub">{sub}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="error-banner">{message}</div>;
}

export function BackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button className="back-link" onClick={() => navigate(to)}>
      <ChevronLeftIcon size={16} /> {label}
    </button>
  );
}

export function Money({ value }: { value: number }) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
  return <span>{formatted}</span>;
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
