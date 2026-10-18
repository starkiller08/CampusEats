"use client";

import { useEffect } from "react";
import Icon from "./Icon";
import { STATUS_LABELS } from "@/lib/staff/mockData";

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, tone = "green", hint }) {
  return (
    <div className="card stat-card">
      <span className={`stat-icon tone-${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

const STATUS_TONE = { received: "blue", preparing: "amber", ready: "green", completed: "muted", cancelled: "red" };

export function StatusPill({ status }) {
  return <span className={`pill pill-${STATUS_TONE[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function RefundPill({ refund }) {
  if (!refund) return null;
  const tone = { requested: "red", approved: "muted", declined: "muted" }[refund.status];
  const label = { requested: "Refund requested", approved: "Refunded", declined: "Refund declined" }[refund.status];
  return <span className={`pill pill-${tone}`}>{label}</span>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          className={`tab ${value === t.value ? "is-active" : ""}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onConfirm, onClose }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? "is-on" : ""}`}
      onClick={onChange}
    >
      <span className="switch-knob" />
    </button>
  );
}

export function EmptyState({ icon = "bag", title, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={32} />
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
