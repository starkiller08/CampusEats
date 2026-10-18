"use client";

import { useState } from "react";
import Icon from "@/components/staff/Icon";
import { RoleGuard } from "@/components/staff/StaffShell";
import { ConfirmDialog, EmptyState, Modal, PageHeader, Toggle } from "@/components/staff/ui";
import { useStaff } from "@/lib/staff/StaffStore";
import { CATEGORIES } from "@/lib/staff/mockData";
import { money } from "@/lib/staff/format";

const AUDIENCE = { all: "Everyone", student: "Students", staff: "UOW staff", public: "Public" };
const today = () => new Date().toISOString().slice(0, 10);

function promoStatus(p) {
  const d = today();
  if (p.end < d) return { key: "expired", label: "Expired", tone: "muted" };
  if (!p.active) return { key: "paused", label: "Paused", tone: "muted" };
  if (p.start > d) return { key: "scheduled", label: "Scheduled", tone: "blue" };
  return { key: "live", label: "Live", tone: "green" };
}

function describe(p, menu) {
  const amount = p.type === "percent" ? `${p.value}% off` : `${money(p.value)} off`;
  const target =
    p.scope === "all" ? "the whole menu" : p.scope === "category" ? `all ${p.target}` : menu.find((m) => m.id === p.target)?.name ?? "a removed item";
  return `${amount} ${target}`;
}

function PromoForm({ promo, isNew, onClose }) {
  const { menu, actions } = useStaff();
  const [form, setForm] = useState({ ...promo, value: String(promo.value) });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const value = Number(form.value);

  const errors = {
    title: !form.title.trim() ? "Give the promotion a name" : "",
    value: !(value > 0) ? "Enter a discount above 0" : form.type === "percent" && value > 90 ? "Percentage discounts are capped at 90%" : "",
    target: form.scope !== "all" && !form.target ? "Choose what the promotion applies to" : "",
    end: !form.start || !form.end ? "Choose start and end dates" : form.end < form.start ? "End date must be after the start date" : "",
  };
  const valid = !Object.values(errors).some(Boolean);
  const err = (k) => touched && errors[k] && <span className="error-text">{errors[k]}</span>;

  const save = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    actions.savePromotion({ ...form, title: form.title.trim(), value }, isNew);
    onClose();
  };

  return (
    <Modal
      wide
      title={isNew ? "New promotion" : "Edit promotion"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="promo-form">{isNew ? "Create promotion" : "Save changes"}</button>
        </>
      }
    >
      <form id="promo-form" className="form-grid" onSubmit={save} noValidate>
        <label className="field full">
          <span>Promotion name</span>
          <input className={`input ${touched && errors.title ? "is-invalid" : ""}`} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Exam week coffee" autoFocus />
          {err("title")}
        </label>
        <label className="field">
          <span>Discount type</span>
          <select className="select" value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </label>
        <label className="field">
          <span>{form.type === "percent" ? "Percent (%)" : "Amount ($)"}</span>
          <input className={`input num ${touched && errors.value ? "is-invalid" : ""}`} type="number" min="0" step={form.type === "percent" ? 1 : 0.5} value={form.value} onChange={(e) => set("value", e.target.value)} />
          {err("value")}
        </label>
        <label className="field">
          <span>Applies to</span>
          <select className="select" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value, target: "" }))}>
            <option value="all">Whole menu</option>
            <option value="category">A category</option>
            <option value="item">A single item</option>
          </select>
        </label>
        <label className="field">
          <span>{form.scope === "item" ? "Item" : "Category"}</span>
          <select className="select" value={form.target} onChange={(e) => set("target", e.target.value)} disabled={form.scope === "all"}>
            <option value="">{form.scope === "all" ? "Not needed" : "Choose…"}</option>
            {form.scope === "category" && CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            {form.scope === "item" && menu.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {err("target")}
        </label>
        <label className="field">
          <span>Start date</span>
          <input className="input" type="date" value={form.start} onChange={(e) => set("start", e.target.value)} />
        </label>
        <label className="field">
          <span>End date</span>
          <input className={`input ${touched && errors.end ? "is-invalid" : ""}`} type="date" value={form.end} onChange={(e) => set("end", e.target.value)} />
          {err("end")}
        </label>
        <div className="field full">
          <span>Who can use it</span>
          <div className="chip-group">
            {Object.entries(AUDIENCE).map(([k, label]) => (
              <button type="button" key={k} className={`chip ${form.audience === k ? "is-on" : ""}`} onClick={() => set("audience", k)} aria-pressed={form.audience === k}>{label}</button>
            ))}
          </div>
          <small>Audience is checked against the customer's verified account tier at checkout.</small>
        </div>
        <div className="notice full">Preview: <strong>{describe({ ...form, value }, menu)}</strong> for {AUDIENCE[form.audience].toLowerCase()}.</div>
      </form>
    </Modal>
  );
}

function PromotionsPage() {
  const { promotions, menu, actions } = useStaff();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const order = { live: 0, scheduled: 1, paused: 2, expired: 3 };
  const sorted = [...promotions].sort((a, b) => order[promoStatus(a).key] - order[promoStatus(b).key]);
  const live = promotions.filter((p) => promoStatus(p).key === "live").length;

  const newPromo = () => {
    const end = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    setEditing({ promo: { id: `promo-${Date.now()}`, title: "", type: "percent", value: 10, scope: "all", target: "", audience: "all", start: today(), end, active: true }, isNew: true });
  };

  return (
    <>
      <PageHeader title="Promotions" subtitle={`${live} live promotion${live === 1 ? "" : "s"}. Discounts are applied automatically at checkout.`}>
        <button className="btn btn-primary" onClick={newPromo}><Icon name="plus" size={18} /> New promotion</button>
      </PageHeader>

      {sorted.length === 0 ? (
        <div className="card"><EmptyState icon="promo" title="No promotions yet">Create one to boost quiet periods or reward students.</EmptyState></div>
      ) : (
        <div className="grid grid-3">
          {sorted.map((p) => {
            const st = promoStatus(p);
            return (
              <article key={p.id} className={`card promo-card ${st.key === "expired" ? "is-dim" : ""}`}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className={`pill pill-${st.tone}`}>{st.label}</span>
                  {st.key !== "expired" && <Toggle label={`${p.title} active`} checked={p.active} onChange={() => actions.togglePromotion(p)} />}
                </div>
                <div className="promo-value">{p.type === "percent" ? `${p.value}%` : money(p.value)} <small>off</small></div>
                <h3>{p.title}</h3>
                <p className="muted">{describe(p, menu)}</p>
                <dl className="kv promo-kv">
                  <dt>For</dt><dd>{AUDIENCE[p.audience]}</dd>
                  <dt>Runs</dt><dd>{new Date(p.start).toLocaleDateString("en-AU", { day: "numeric", month: "short" })} to {new Date(p.end).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</dd>
                </dl>
                <div className="row" style={{ marginTop: "auto" }}>
                  <button className="btn btn-soft btn-sm" onClick={() => setEditing({ promo: p, isNew: false })}><Icon name="edit" size={16} /> Edit</button>
                  <button className="btn btn-danger-soft btn-sm" onClick={() => setDeleting(p)}><Icon name="trash" size={16} /> Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && <PromoForm promo={editing.promo} isNew={editing.isNew} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          danger
          title={`Delete "${deleting.title}"?`}
          message="Customers will no longer get this discount. Orders already placed are not affected."
          confirmLabel="Delete promotion"
          onConfirm={() => actions.deletePromotion(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}

export default function PromotionsRoute() {
  return (
    <RoleGuard allow={["owner"]}>
      <PromotionsPage />
    </RoleGuard>
  );
}
