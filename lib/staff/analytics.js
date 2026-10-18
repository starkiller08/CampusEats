// Generates deterministic sales history for the analytics prototype (FR11).
// In the full build this comes from GET /api/outlets/:id/reports?from=&to=.
import { seeded } from "./mockData";

const DAY = 864e5;
// Share of a day's orders placed in each trading hour (7am-3pm): breakfast and lunch peaks.
const HOUR_PROFILE = { 7: 0.05, 8: 0.14, 9: 0.1, 10: 0.09, 11: 0.15, 12: 0.2, 13: 0.14, 14: 0.08, 15: 0.05 };

function dayStart(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Daily rows for the last `days` days plus the period before, for comparisons.
export function buildHistory(outletId, menu, days, now = Date.now()) {
  const scale = outletId === "ugc" ? 1 : 0.55;
  const weights = menu.map((m, i) => ({ item: m, w: (m.available ? 1 : 0.4) * (1 + ((i * 7) % 5)) }));
  const totalW = weights.reduce((s, x) => s + x.w, 0);
  const today = dayStart(now);

  const rows = [];
  for (let i = days * 2 - 1; i >= 0; i--) {
    const date = today - i * DAY;
    const dow = new Date(date).getDay();
    const rand = seeded(Math.floor(date / DAY) * 13 + outletId.charCodeAt(0));
    const open = dow !== 0 && dow !== 6;
    const base = dow === 5 ? 38 : 52;
    const orders = open ? Math.round(base * scale * (0.75 + rand() * 0.5)) : 0;
    const items = {};
    let revenue = 0;
    for (const { item, w } of weights) {
      const qty = Math.round((orders * 1.6 * w) / totalW * (0.7 + rand() * 0.6));
      items[item.id] = qty;
      revenue += qty * item.price;
    }
    const refunds = open ? Math.round(rand() * 2.4) : 0;
    const student = 0.68 + rand() * 0.08;
    const staff = 0.16 + rand() * 0.06;
    rows.push({
      date,
      orders,
      revenue: Math.round(revenue * 100) / 100,
      refunds,
      items,
      tiers: { student, staff, public: Math.max(0, 1 - student - staff) },
    });
  }
  return { current: rows.slice(days), previous: rows.slice(0, days) };
}

export function summarise(rows, menu) {
  const orders = rows.reduce((s, r) => s + r.orders, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const refunds = rows.reduce((s, r) => s + r.refunds, 0);

  const hourly = Object.entries(HOUR_PROFILE).map(([h, share]) => ({ hour: Number(h), orders: Math.round(orders * share) }));

  const itemTotals = menu
    .map((m) => {
      const qty = rows.reduce((s, r) => s + (r.items[m.id] || 0), 0);
      return { id: m.id, name: m.name, emoji: m.emoji, qty, revenue: qty * m.price };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const weighted = (k) => (orders ? rows.reduce((s, r) => s + r.tiers[k] * r.orders, 0) / orders : 0);

  return {
    orders,
    revenue,
    refunds,
    aov: orders ? revenue / orders : 0,
    refundRate: orders ? refunds / orders : 0,
    hourly,
    itemTotals,
    tiers: { student: weighted("student"), staff: weighted("staff"), public: weighted("public") },
  };
}

export function pctChange(now, before) {
  if (!before) return null;
  return (now - before) / before;
}
