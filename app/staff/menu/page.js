"use client";

import { useState } from "react";
import Icon from "@/components/staff/Icon";
import { RoleGuard } from "@/components/staff/StaffShell";
import { ConfirmDialog, EmptyState, Modal, PageHeader, Tabs, Toggle } from "@/components/staff/ui";
import { useStaff } from "@/lib/staff/StaffStore";
import { ALLERGENS, CATEGORIES, DIETARY } from "@/lib/staff/mockData";
import { money } from "@/lib/staff/format";

const EMOJIS = ["🥑", "🌯", "🍔", "🥗", "🍛", "🍜", "🍕", "🥪", "🌮", "🍣", "🧁", "🍞", "🍪", "🥐", "☕", "🧋", "🥤", "🥭", "🍋", "🫐"];

const blankItem = () => ({
  id: `new-${Date.now()}`,
  name: "",
  category: CATEGORIES[1],
  price: "",
  staffPrice: "",
  emoji: "🥗",
  description: "",
  allergens: [],
  dietary: [],
  prepMins: 5,
  available: true,
});

function MenuItemForm({ item, isNew, onClose }) {
  const { menu, actions } = useStaff();
  const [form, setForm] = useState({ ...item, price: String(item.price), staffPrice: String(item.staffPrice) });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k, v) => set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);

  const price = Number(form.price);
  const staffPrice = form.staffPrice === "" ? null : Number(form.staffPrice);
  const errors = {
    name: !form.name.trim()
      ? "Name is required"
      : menu.some((m) => m.id !== form.id && m.name.toLowerCase() === form.name.trim().toLowerCase())
        ? "An item with this name already exists"
        : "",
    price: !(price > 0) ? "Enter a price above $0" : price > 200 ? "Price looks too high" : "",
    staffPrice: staffPrice != null && !(staffPrice > 0 && staffPrice <= price) ? "Staff price must be between $0 and the regular price" : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    actions.saveMenuItem(
      {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Math.round(price * 100) / 100,
        staffPrice: Math.round((staffPrice ?? price) * 100) / 100,
        prepMins: Number(form.prepMins) || 1,
      },
      isNew
    );
    onClose();
  };

  const err = (k) => touched && errors[k] && <span className="error-text">{errors[k]}</span>;

  return (
    <Modal
      wide
      title={isNew ? "Add menu item" : `Edit ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="menu-form">{isNew ? "Add item" : "Save changes"}</button>
        </>
      }
    >
      <form id="menu-form" className="form-grid" onSubmit={save} noValidate>
        <label className="field full">
          <span>Item name</span>
          <input className={`input ${touched && errors.name ? "is-invalid" : ""}`} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Chicken Wrap" autoFocus />
          {err("name")}
        </label>
        <label className="field full">
          <span>Description</span>
          <input className="input" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description customers see on the menu" />
        </label>
        <label className="field">
          <span>Category</span>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Prep time (minutes)</span>
          <input className="input num" type="number" min="1" max="60" value={form.prepMins} onChange={(e) => set("prepMins", e.target.value)} />
          <small>Used to estimate queue wait times.</small>
        </label>
        <label className="field">
          <span>Price</span>
          <input className={`input num ${touched && errors.price ? "is-invalid" : ""}`} type="number" step="0.10" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
          {err("price")}
        </label>
        <label className="field">
          <span>UOW staff price</span>
          <input className={`input num ${touched && errors.staffPrice ? "is-invalid" : ""}`} type="number" step="0.10" min="0" value={form.staffPrice} onChange={(e) => set("staffPrice", e.target.value)} placeholder="Same as price" />
          {err("staffPrice") || <small>Charged to verified @uow.edu.au staff accounts.</small>}
        </label>
        <div className="field full">
          <span>Image</span>
          <div className="emoji-pick">
            {EMOJIS.map((em) => (
              <button type="button" key={em} className={form.emoji === em ? "is-on" : ""} onClick={() => set("emoji", em)} aria-label={`Use ${em}`}>{em}</button>
            ))}
          </div>
          <small>Prototype uses icons; the full build will support photo upload.</small>
        </div>
        <div className="field full">
          <span>Allergens</span>
          <div className="chip-group">
            {ALLERGENS.map((a) => (
              <button type="button" key={a} className={`chip ${form.allergens.includes(a) ? "is-on" : ""}`} onClick={() => toggleIn("allergens", a)} aria-pressed={form.allergens.includes(a)}>{a}</button>
            ))}
          </div>
        </div>
        <div className="field full">
          <span>Dietary tags</span>
          <div className="chip-group">
            {DIETARY.map((d) => (
              <button type="button" key={d} className={`chip ${form.dietary.includes(d) ? "is-on" : ""}`} onClick={() => toggleIn("dietary", d)} aria-pressed={form.dietary.includes(d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="field full row" style={{ justifyContent: "space-between" }}>
          <span>Available to order</span>
          <Toggle label="Available to order" checked={form.available} onChange={() => set("available", !form.available)} />
        </div>
      </form>
    </Modal>
  );
}

function MenuPage() {
  const { menu, promotions, actions } = useStaff();
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const q = query.trim().toLowerCase();
  const visible = menu.filter(
    (m) =>
      (status === "all" || (status === "available") === m.available) &&
      (category === "All" || m.category === category) &&
      (!q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
  );
  const onPromo = (m) => promotions.some((p) => p.active && (p.scope === "all" || (p.scope === "category" && p.target === m.category) || (p.scope === "item" && p.target === m.id)));

  return (
    <>
      <PageHeader title="Menu Management" subtitle={`${menu.length} items · ${menu.filter((m) => !m.available).length} unavailable`}>
        <button className="btn btn-primary" onClick={() => setEditing({ item: blankItem(), isNew: true })}>
          <Icon name="plus" size={18} /> Add new item
        </button>
      </PageHeader>

      <div className="toolbar">
        <Tabs
          value={status}
          onChange={setStatus}
          tabs={[
            { value: "all", label: "All items", count: menu.length },
            { value: "available", label: "Available", count: menu.filter((m) => m.available).length },
            { value: "unavailable", label: "Unavailable", count: menu.filter((m) => !m.available).length },
          ]}
        />
        <div className="row">
          <select className="select" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="search">
            <Icon name="search" size={18} />
            <span className="sr-only">Search menu</span>
            <input className="input" placeholder="Search items" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <EmptyState icon="menu" title="No items found">Change the filters or add a new item.</EmptyState>
        </div>
      ) : (
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Tags</th>
                <th>Available</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id} className={m.available ? "" : "is-unavailable"}>
                  <td>
                    <div className="item-cell">
                      <span className="item-thumb">{m.emoji}</span>
                      <div>
                        <strong>{m.name}</strong>
                        {onPromo(m) && <span className="pill pill-amber" style={{ marginLeft: 8 }}>Promo</span>}
                        <div className="cell-sub">{m.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.category}<div className="cell-sub">{m.prepMins} min prep</div></td>
                  <td>
                    <strong className="num price">{money(m.price)}</strong>
                    {m.staffPrice < m.price && <div className="cell-sub">Staff {money(m.staffPrice)}</div>}
                  </td>
                  <td>
                    <div className="tag-list">
                      {m.dietary.map((d) => <span key={d} className="tag tag-diet">{d}</span>)}
                      {m.allergens.map((a) => <span key={a} className="tag">{a}</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <Toggle label={`${m.name} available`} checked={m.available} onChange={() => actions.toggleAvailability(m)} />
                      <span className={`pill ${m.available ? "pill-green" : "pill-red"}`}>{m.available ? "Available" : "Unavailable"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="icon-btn edit" onClick={() => setEditing({ item: m, isNew: false })} aria-label={`Edit ${m.name}`}><Icon name="edit" size={18} /></button>
                      <button className="icon-btn danger" onClick={() => setDeleting(m)} aria-label={`Delete ${m.name}`}><Icon name="trash" size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <MenuItemForm item={editing.item} isNew={editing.isNew} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          danger
          title={`Delete ${deleting.name}?`}
          message="This removes the item from the customer menu. Past orders keep their record. If it's only temporarily out of stock, mark it unavailable instead."
          confirmLabel="Delete item"
          onConfirm={() => actions.deleteMenuItem(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}

export default function MenuRoute() {
  return (
    <RoleGuard allow={["owner"]}>
      <MenuPage />
    </RoleGuard>
  );
}
