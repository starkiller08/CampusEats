"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/staff/Icon";
import BarChart from "@/components/staff/BarChart";
import { RoleGuard } from "@/components/staff/StaffShell";
import { PageHeader } from "@/components/staff/ui";
import { useStaff } from "@/lib/staff/StaffStore";
import { buildHistory, pctChange, summarise } from "@/lib/staff/analytics";
import { money, shortDate } from "@/lib/staff/format";
import { TIERS } from "@/lib/staff/mockData";

const RANGES = [7, 14, 30];
const TIER_COLORS = { student: "#2f8a57", staff: "#3b74c9", public: "#d08a2c" };
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
const compact = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `$${Math.round(v)}`);

function Kpi({ label, value, change, invert }) {
  const good = change == null ? null : invert ? change < 0 : change > 0;
  return (
    <div className="card stat-card kpi">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change != null && (
          <div className="stat-hint">
            {Math.abs(change) < 0.0005 ? (
              <span>No change</span>
            ) : (
              <span className={good ? "trend-up" : "trend-down"}>{change > 0 ? "▲" : "▼"} {Math.abs(change * 100).toFixed(1)}%</span>
            )}{" "}
            vs previous period
          </div>
        )}
      </div>
    </div>
  );
}

function downloadCsv(rows, menu, outletName, days) {
  const header = ["Date", "Orders", "Revenue", "Refunds", ...menu.map((m) => `${m.name} (qty)`)];
  const lines = rows.map((r) => [new Date(r.date).toISOString().slice(0, 10), r.orders, r.revenue.toFixed(2), r.refunds, ...menu.map((m) => r.items[m.id] || 0)]);
  const csv = [header, ...lines].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${outletName.replace(/\s+/g, "-").toLowerCase()}-sales-last-${days}-days.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AnalyticsPage() {
  const { outlet, outletId, menu } = useStaff();
  const [days, setDays] = useState(7);
  const [showTable, setShowTable] = useState(false);

  const { current, previous } = useMemo(() => buildHistory(outletId, menu, days), [outletId, menu, days]);
  const now = useMemo(() => summarise(current, menu), [current, menu]);
  const before = useMemo(() => summarise(previous, menu), [previous, menu]);

  const peak = now.hourly.reduce((a, b) => (b.orders > a.orders ? b : a), now.hourly[0]);
  const top = now.itemTotals.slice(0, 5);
  const topMax = top[0]?.revenue || 1;

  return (
    <>
      <PageHeader title="Analytics" subtitle={`Sales and order trends for ${outlet.name}.`}>
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r} className={days === r ? "is-active" : ""} onClick={() => setDays(r)}>Last {r} days</button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => downloadCsv(current, menu, outlet.name, days)}>
          <Icon name="download" size={16} /> Export CSV
        </button>
      </PageHeader>

      <div className="grid grid-4">
        <Kpi label="Revenue" value={money(now.revenue)} change={pctChange(now.revenue, before.revenue)} />
        <Kpi label="Orders" value={now.orders} change={pctChange(now.orders, before.orders)} />
        <Kpi label="Avg. order value" value={money(now.aov)} change={pctChange(now.aov, before.aov)} />
        <Kpi label="Refund rate" value={`${(now.refundRate * 100).toFixed(1)}%`} change={pctChange(now.refundRate, before.refundRate)} invert />
      </div>

      <section className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <h2>Total sales</h2>
            <p className="muted">Last {days} days · closed on weekends</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTable((v) => !v)}>
            <Icon name={showTable ? "analytics" : "list"} size={16} /> {showTable ? "Chart view" : "Table view"}
          </button>
        </div>
        {showTable ? (
          <div className="table-wrap">
            <table className="simple-table">
              <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Refunds</th></tr></thead>
              <tbody>
                {current.map((r) => (
                  <tr key={r.date}>
                    <td>{new Date(r.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</td>
                    <td className="num">{r.orders || "Closed"}</td>
                    <td className="num">{money(r.revenue)}</td>
                    <td className="num">{r.refunds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <BarChart
            ariaLabel={`Daily revenue for the last ${days} days`}
            format={compact}
            labelEvery={days > 14 ? 4 : days > 7 ? 2 : 1}
            data={current.map((r) => ({
              key: r.date,
              label: shortDate(r.date),
              value: r.revenue,
              muted: !r.orders,
              tooltip: r.orders
                ? `${new Date(r.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}: ${money(r.revenue)} from ${r.orders} orders`
                : `${shortDate(r.date)}: closed`,
            }))}
          />
        )}
      </section>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h2>Peak ordering times</h2>
              <p className="muted">Busiest hour: <strong>{hourLabel(peak.hour)} to {hourLabel(peak.hour + 1)}</strong>. Plan staff around it.</p>
            </div>
          </div>
          <BarChart
            ariaLabel="Orders by hour of day"
            height={200}
            highlight={peak.hour}
            data={now.hourly.map((h) => ({
              key: h.hour,
              label: hourLabel(h.hour),
              value: h.orders,
              tooltip: `${hourLabel(h.hour)} to ${hourLabel(h.hour + 1)}: ${h.orders} orders`,
            }))}
          />
        </section>

        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h2>Top selling items</h2>
              <p className="muted">By revenue, last {days} days</p>
            </div>
          </div>
          <ol className="top-items">
            {top.map((it, i) => (
              <li key={it.id}>
                <span className="rank">{i + 1}</span>
                <span className="item-thumb sm">{it.emoji}</span>
                <div className="top-main">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{it.name}</strong>
                    <strong className="num">{money(it.revenue)}</strong>
                  </div>
                  <div className="meter"><span style={{ width: `${(it.revenue / topMax) * 100}%` }} /></div>
                  <span className="cell-sub">{it.qty} sold</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <h2>Orders by customer type</h2>
            <p className="muted">Based on verified account tier at checkout</p>
          </div>
        </div>
        <div className="stacked" role="img" aria-label="Share of orders by customer type">
          {Object.entries(now.tiers).map(([k, v]) => (
            <span key={k} style={{ width: `${v * 100}%`, background: TIER_COLORS[k] }} title={`${TIERS[k]}: ${(v * 100).toFixed(0)}%`} />
          ))}
        </div>
        <ul className="legend">
          {Object.entries(now.tiers).map(([k, v]) => (
            <li key={k}>
              <span className="swatch" style={{ background: TIER_COLORS[k] }} />
              {TIERS[k]} <strong className="num">{(v * 100).toFixed(0)}%</strong>
              <span className="muted num">· {Math.round(v * now.orders)} orders</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function AnalyticsRoute() {
  return (
    <RoleGuard allow={["owner"]}>
      <AnalyticsPage />
    </RoleGuard>
  );
}
