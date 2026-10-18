"use client";

import Link from "next/link";
import Icon from "@/components/staff/Icon";
import { EmptyState, PageHeader, StatCard, Toggle } from "@/components/staff/ui";
import { AdvanceButton, useOrderDialog } from "@/components/staff/OrderDialogs";
import { useNow, useStaff } from "@/lib/staff/StaffStore";
import { ago, isActive, money, queueStats } from "@/lib/staff/format";

const LEVEL = {
  quiet: { label: "Quiet", tone: "green" },
  moderate: { label: "Moderate", tone: "amber" },
  busy: { label: "Busy", tone: "red" },
};

export default function StaffDashboard() {
  const now = useNow();
  const { outlet, orders, menu, settings, role, actions } = useStaff();
  const [openOrder, dialog] = useOrderDialog(orders);

  const count = (s) => orders.filter((o) => o.status === s).length;
  const active = orders.filter(isActive);
  const incoming = orders.filter((o) => o.status === "received").sort((a, b) => a.placedAt - b.placedAt);
  const refunds = orders.filter((o) => o.refund?.status === "requested");
  const unavailable = menu.filter((m) => !m.available);
  const overdue = orders.filter((o) => o.status === "ready" && now - o.pickupAt > 10 * 60 * 1000);
  const queue = queueStats(orders, menu);
  const sales = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total - (o.refund?.status === "approved" ? o.refund.amount : 0), 0);

  const alerts = [
    !settings.acceptingOrders && { tone: "amber", icon: "pause", text: "Online ordering is paused. Customers can't place new orders.", href: null },
    refunds.length > 0 && { tone: "red", icon: "refund", text: `${refunds.length} refund request${refunds.length > 1 ? "s" : ""} waiting for review`, href: "/staff/orders?tab=refunds" },
    overdue.length > 0 && { tone: "amber", icon: "clock", text: `${overdue.length} order${overdue.length > 1 ? "s" : ""} ready but not collected (10+ min past pickup time)`, href: "/staff/orders?tab=ready" },
    ...unavailable.map((m) => ({ tone: "amber", icon: "alert", text: `${m.name} is marked unavailable`, href: role === "owner" ? "/staff/menu" : null })),
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Here's what's happening at ${outlet.name} today.`}>
        <button className="btn btn-ghost" onClick={actions.simulateOrder} title="Prototype only: pretend a customer just ordered">
          <Icon name="plus" size={16} /> Simulate order
        </button>
        <Link href="/staff/orders" className="btn btn-primary">
          Open order board <Icon name="arrow" size={16} />
        </Link>
      </PageHeader>

      <div className="grid grid-4">
        <StatCard icon="orders" label="Active orders" value={active.length} hint={`${count("received")} awaiting acceptance`} />
        <StatCard icon="users" label="Customers in queue" value={queue.inQueue} tone="blue" />
        <StatCard icon="clock" label="Est. wait time" value={queue.waitMins ? `${queue.waitMins} min` : "None"} tone="amber" />
        <StatCard icon="refund" label="Refund requests" value={refunds.length} tone="red" />
      </div>

      <div className="grid grid-main" style={{ marginTop: 16 }}>
        <div className="stack">
          <section className="card card-pad">
            <div className="card-head">
              <h2><Icon name="analytics" /> Live order status</h2>
            </div>
            <div className="status-strip">
              {[
                { s: "received", label: "New", tone: "blue", icon: "bell" },
                { s: "preparing", label: "Preparing", tone: "amber", icon: "clock" },
                { s: "ready", label: "Ready for pickup", tone: "green", icon: "bag" },
                { s: "completed", label: "Completed today", tone: "muted", icon: "check" },
              ].map((x) => (
                <Link key={x.s} href={`/staff/orders?tab=${x.s}`} className={`status-tile tile-${x.tone}`}>
                  <Icon name={x.icon} size={22} />
                  <span>{x.label}</span>
                  <strong className="num">{count(x.s)}</strong>
                </Link>
              ))}
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-head">
              <h2><Icon name="bell" /> Incoming orders</h2>
              {incoming.length > 0 && <span className="pill pill-blue">{incoming.length} new</span>}
            </div>
            {incoming.length === 0 ? (
              <EmptyState icon="check" title="All caught up">New orders appear here as customers pay.</EmptyState>
            ) : (
              <ul className="incoming">
                {incoming.map((o) => (
                  <li key={o.id}>
                    <button className="incoming-main" onClick={() => openOrder(o.id)}>
                      <strong>#{o.number}</strong>
                      <span>{o.customer.name}</span>
                      <span className="muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</span>
                    </button>
                    <span className="muted num">{ago(o.placedAt, now)}</span>
                    <AdvanceButton order={o} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card-pad">
            <div className="card-head">
              <h2><Icon name="alert" /> Alerts</h2>
              <Link href="/staff/orders" className="link">View orders →</Link>
            </div>
            {alerts.length === 0 ? (
              <EmptyState icon="check" title="No alerts">Everything is running smoothly.</EmptyState>
            ) : (
              alerts.map((a, i) => {
                const body = (
                  <>
                    <Icon name={a.icon} size={18} />
                    <span>{a.text}</span>
                    <span className="spacer" />
                    {a.href && <Icon name="arrow" size={16} />}
                  </>
                );
                return a.href ? (
                  <Link key={i} href={a.href} className={`alert-row alert-${a.tone} is-link`}>{body}</Link>
                ) : (
                  <div key={i} className={`alert-row alert-${a.tone}`}>{body}</div>
                );
              })
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card card-pad">
            <div className="card-head">
              <h2><Icon name="users" /> Current queue</h2>
              <span className={`pill pill-${LEVEL[queue.level].tone}`}>{LEVEL[queue.level].label}</span>
            </div>
            <div className="queue-big">
              <strong className="num">{queue.inQueue}</strong>
              <span>customer{queue.inQueue === 1 ? "" : "s"} in queue</span>
            </div>
            <p className="muted">Estimated wait: {queue.waitMins ? `~${queue.waitMins} mins` : "no wait"}</p>
            <div className="queue-people" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <Icon key={i} name="user" size={20} className={i < queue.inQueue ? "is-filled" : ""} />
              ))}
            </div>
            <p className="notice" style={{ marginTop: 14 }}>
              Customers see this queue level and wait time on the outlet page before they order.
            </p>
          </section>

          <section className="card card-pad">
            <div className="card-head">
              <h2><Icon name={settings.acceptingOrders ? "play" : "pause"} /> Online ordering</h2>
              <Toggle
                label="Accept online orders"
                checked={settings.acceptingOrders}
                onChange={() =>
                  actions.updateSettings(
                    { acceptingOrders: !settings.acceptingOrders },
                    settings.acceptingOrders ? "Online ordering paused" : "Online ordering resumed"
                  )
                }
              />
            </div>
            <p className="muted">
              {settings.acceptingOrders
                ? "Customers can place orders. Pause during rush periods or if the kitchen needs to catch up."
                : "Ordering is paused. Existing orders still need to be completed."}
            </p>
          </section>

          {role === "owner" && (
            <section className="card card-pad">
              <div className="card-head">
                <h2><Icon name="dollar" /> Today so far</h2>
                <Link href="/staff/analytics" className="link">Analytics →</Link>
              </div>
              <div className="kpi-pair">
                <div><span className="muted">Net sales</span><strong className="num">{money(sales)}</strong></div>
                <div><span className="muted">Orders</span><strong className="num">{orders.filter((o) => o.status !== "cancelled").length}</strong></div>
              </div>
            </section>
          )}
        </div>
      </div>
      {dialog}
    </>
  );
}
