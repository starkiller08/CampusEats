export const money = (n) =>
  `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const clock = (t) =>
  new Date(t).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

export const shortDate = (t) =>
  new Date(t).toLocaleDateString("en-AU", { day: "numeric", month: "short" });

export function ago(t, now = Date.now()) {
  const mins = Math.round((now - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}

export function minsUntil(t, now = Date.now()) {
  return Math.round((t - now) / 60000);
}

export const isActive = (o) => ["received", "preparing", "ready"].includes(o.status);
export const inKitchen = (o) => ["received", "preparing"].includes(o.status);

// Queue estimate shown to staff (and later to customers before they order):
// sum of prep time for orders still in the kitchen, assuming two items in parallel.
export function queueStats(orders, menu) {
  const prepById = Object.fromEntries(menu.map((m) => [m.id, m.prepMins]));
  const kitchen = orders.filter(inKitchen);
  const prepMins = kitchen.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + (prepById[i.menuId] ?? 5) * i.qty, 0),
    0
  );
  const waitMins = kitchen.length ? Math.max(5, Math.round(prepMins / 2)) : 0;
  const level = waitMins >= 25 ? "busy" : waitMins >= 12 ? "moderate" : "quiet";
  return { inQueue: kitchen.length, waitMins, level };
}
