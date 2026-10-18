"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/staff/Icon";
import { EmptyState, PageHeader, RefundPill, StatusPill, Tabs } from "@/components/staff/ui";
import { AdvanceButton, RefundReviewDialog, useOrderDialog } from "@/components/staff/OrderDialogs";
import { useNow, useStaff } from "@/lib/staff/StaffStore";
import { TIERS } from "@/lib/staff/mockData";
import { ago, clock, minsUntil, money } from "@/lib/staff/format";

const FILTERS = {
  all: { label: "All", test: () => true },
  received: { label: "New", test: (o) => o.status === "received" },
  preparing: { label: "Preparing", test: (o) => o.status === "preparing" },
  ready: { label: "Ready", test: (o) => o.status === "ready" },
  completed: { label: "Completed", test: (o) => o.status === "completed" },
  cancelled: { label: "Cancelled", test: (o) => o.status === "cancelled" },
  refunds: { label: "Refund requests", test: (o) => o.refund?.status === "requested" },
};

const COLUMNS = [
  { status: "received", title: "New", tone: "blue", hint: "Accept to start preparing" },
  { status: "preparing", title: "Preparing", tone: "amber", hint: "Mark ready to notify the customer" },
  { status: "ready", title: "Ready for collection", tone: "green", hint: "Check pickup code on collection" },
];

function PickupDue({ order, now }) {
  const m = minsUntil(order.pickupAt, now);
  if (order.status === "completed" || order.status === "cancelled") return <span className="muted">Pickup {clock(order.pickupAt)}</span>;
  if (m < 0) return <span className="due due-late">Pickup {Math.abs(m)} min overdue</span>;
  return <span className={`due ${m <= 5 ? "due-soon" : ""}`}>Pickup in {m} min · {clock(order.pickupAt)}</span>;
}

function OrderCard({ order, now, onOpen }) {
  return (
    <article className={`ticket ${order.refund?.status === "requested" ? "is-flag" : ""}`}>
      <button className="ticket-head" onClick={onOpen}>
        <strong>#{order.number}</strong>
        <span className="muted">{ago(order.placedAt, now)}</span>
      </button>
      <div className="ticket-customer">
        {order.customer.name} <span className="tag">{TIERS[order.customer.tier]}</span>
      </div>
      <ul className="ticket-items">
        {order.items.map((i) => (
          <li key={i.menuId}><span className="num">{i.qty}×</span> {i.name}</li>
        ))}
      </ul>
      {order.note && <div className="ticket-note"><Icon name="alert" size={14} /> {order.note}</div>}
      <PickupDue order={order} now={now} />
      <div className="ticket-foot">
        <button className="btn btn-ghost btn-sm" onClick={onOpen}><Icon name="eye" size={16} /> Details</button>
        <AdvanceButton order={order} />
      </div>
    </article>
  );
}

function Board({ orders, now, openOrder }) {
  return (
    <div className="board">
      {COLUMNS.map((c) => {
        const list = orders.filter((o) => o.status === c.status).sort((a, b) => a.pickupAt - b.pickupAt);
        return (
          <section key={c.status} className={`board-col col-${c.tone}`}>
            <header>
              <h2>{c.title}</h2>
              <span className="tab-count">{list.length}</span>
            </header>
            <p className="muted board-hint">{c.hint}</p>
            {list.length === 0 ? (
              <div className="board-empty">No orders</div>
            ) : (
              list.map((o) => <OrderCard key={o.id} order={o} now={now} onOpen={() => openOrder(o.id)} />)
            )}
          </section>
        );
      })}
    </div>
  );
}

function OrderTable({ orders, now, openOrder }) {
  const [reviewing, setReviewing] = useState(null);
  if (orders.length === 0) return <div className="card"><EmptyState title="No orders match">Try a different filter or search.</EmptyState></div>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={o.refund?.status === "requested" ? "is-flag" : o.status === "cancelled" ? "is-dim" : ""}>
              <td>
                <strong>#{o.number}</strong>
                <div className="cell-sub">{clock(o.placedAt)} · {ago(o.placedAt, now)}</div>
              </td>
              <td>
                <strong>{o.customer.name}</strong>
                <div className="cell-sub">{o.customer.email}</div>
              </td>
              <td>
                {o.items.map((i) => <div key={i.menuId}>{i.qty > 1 ? `${i.qty}× ` : ""}{i.name}</div>)}
                <div className="cell-sub">{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</div>
              </td>
              <td><strong className="num price">{money(o.total)}</strong></td>
              <td>
                <div className="stack-xs">
                  <StatusPill status={o.status} />
                  <RefundPill refund={o.refund} />
                </div>
              </td>
              <td>
                <div className="actions-cell">
                  <button className="btn btn-soft btn-sm" onClick={() => openOrder(o.id)}><Icon name="eye" size={16} /> View</button>
                  {o.refund?.status === "requested" && (
                    <button className="btn btn-danger-soft btn-sm" onClick={() => setReviewing(o)}><Icon name="refund" size={16} /> Review refund</button>
                  )}
                  <AdvanceButton order={o} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reviewing && <RefundReviewDialog order={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}

function OrdersPage() {
  const now = useNow(15000);
  const router = useRouter();
  const params = useSearchParams();
  const { orders, actions } = useStaff();
  const [openOrder, dialog] = useOrderDialog(orders);
  const [query, setQuery] = useState("");

  const tab = FILTERS[params.get("tab")] ? params.get("tab") : "all";
  // Links from the dashboard pass ?tab=..., which opens the filtered list.
  const view = params.get("view") ?? (params.get("tab") ? "list" : "board");
  const setParams = (next) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => p.set(k, v));
    router.replace(`/staff/orders?${p}`, { scroll: false });
  };

  const q = query.trim().toLowerCase();
  const matches = (o) =>
    !q ||
    String(o.number).includes(q) ||
    o.customer.name.toLowerCase().includes(q) ||
    o.customer.email.toLowerCase().includes(q) ||
    o.items.some((i) => i.name.toLowerCase().includes(q));
  const searched = orders.filter(matches);
  const filtered = searched.filter(FILTERS[tab].test).sort((a, b) => b.placedAt - a.placedAt);

  return (
    <>
      <PageHeader title="Order Management" subtitle="Accept, prepare and hand over orders. Customers are notified at every step.">
        <button className="btn btn-ghost" onClick={actions.simulateOrder}><Icon name="plus" size={16} /> Simulate order</button>
      </PageHeader>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="View">
          <button className={view === "board" ? "is-active" : ""} onClick={() => setParams({ view: "board", tab: "all" })}><Icon name="board" size={16} /> Live board</button>
          <button className={view === "list" ? "is-active" : ""} onClick={() => setParams({ view: "list" })}><Icon name="list" size={16} /> All orders</button>
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search orders</span>
          <input className="input" placeholder="Search order #, customer or item" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {view === "list" && (
        <div style={{ margin: "16px 0 4px" }}>
          <Tabs
            value={tab}
            onChange={(t) => setParams({ tab: t, view: "list" })}
            tabs={Object.entries(FILTERS).map(([value, f]) => ({ value, label: f.label, count: searched.filter(f.test).length }))}
          />
        </div>
      )}

      {view === "board" ? <Board orders={searched} now={now} openOrder={openOrder} /> : <OrderTable orders={filtered} now={now} openOrder={openOrder} />}
      {dialog}
    </>
  );
}

export default function OrdersRoute() {
  return (
    <Suspense fallback={<div className="page-loading">Loading orders…</div>}>
      <OrdersPage />
    </Suspense>
  );
}
