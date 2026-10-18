"use client";

// Client-side store for the Staff / Owner prototype. Every action here maps to
// a planned REST endpoint (noted beside each case) so the reducer can be swapped
// for API calls in the development sprints.

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  buildInitialState,
  makeOrderLine,
  makePickupCode,
  orderTotal,
  outlets,
  randomCustomer,
  STATUS_LABELS,
} from "./mockData";

const STORAGE_KEY = "campuseats.staff.v1";
const NEXT_STAGE = { received: "preparing", preparing: "ready", ready: "completed" };

function updateOutlet(state, fn) {
  const current = state.data[state.outletId];
  return { ...state, data: { ...state.data, [state.outletId]: { ...current, ...fn(current) } } };
}

function mapOrder(state, id, fn) {
  return updateOutlet(state, (o) => ({ orders: o.orders.map((ord) => (ord.id === id ? fn(ord) : ord)) }));
}

function reducer(state, action) {
  switch (action.type) {
    case "load":
      return action.state;
    case "reset":
      return buildInitialState();
    case "setOutlet":
      return { ...state, outletId: action.outletId };
    case "setRole":
      return { ...state, role: action.role };

    // PATCH /api/orders/:id/status
    case "advanceOrder":
      return mapOrder(state, action.id, (o) =>
        NEXT_STAGE[o.status] ? { ...o, status: NEXT_STAGE[o.status], updatedAt: Date.now() } : o
      );
    // PATCH /api/orders/:id/status { status: "cancelled" }
    case "cancelOrder":
      return mapOrder(state, action.id, (o) => ({
        ...o,
        status: "cancelled",
        cancelReason: action.reason,
        payment: { ...o.payment, status: "refunded" },
        updatedAt: Date.now(),
      }));
    // PATCH /api/refunds/:orderId { decision }
    case "resolveRefund":
      return mapOrder(state, action.id, (o) => ({
        ...o,
        refund: { ...o.refund, status: action.approve ? "approved" : "declined", staffNote: action.note || "", resolvedAt: Date.now() },
        payment: action.approve ? { ...o.payment, status: o.refund.amount >= o.total ? "refunded" : "partially refunded" } : o.payment,
      }));
    // POST /api/refunds  (staff-initiated)
    case "issueRefund":
      return mapOrder(state, action.id, (o) => ({
        ...o,
        refund: { status: "approved", amount: action.amount, reason: action.reason, requestedAt: Date.now(), resolvedAt: Date.now(), byStaff: true },
        payment: { ...o.payment, status: action.amount >= o.total ? "refunded" : "partially refunded" },
      }));
    // Simulates POST /api/orders arriving from the customer app
    case "addOrder": {
      const num = state.nextOrderNumber;
      const order = { ...action.order, id: `${state.outletId}-${num}`, number: num, outletId: state.outletId };
      const next = updateOutlet(state, (o) => ({ orders: [order, ...o.orders] }));
      return { ...next, nextOrderNumber: num + 1 };
    }

    // POST /api/menu-items, PUT /api/menu-items/:id
    case "saveMenuItem":
      return updateOutlet(state, (o) => {
        const exists = o.menu.some((m) => m.id === action.item.id);
        return { menu: exists ? o.menu.map((m) => (m.id === action.item.id ? action.item : m)) : [...o.menu, action.item] };
      });
    // DELETE /api/menu-items/:id
    case "deleteMenuItem":
      return updateOutlet(state, (o) => ({ menu: o.menu.filter((m) => m.id !== action.id) }));
    // PATCH /api/menu-items/:id { available }
    case "toggleAvailability":
      return updateOutlet(state, (o) => ({ menu: o.menu.map((m) => (m.id === action.id ? { ...m, available: !m.available } : m)) }));

    // POST/PUT/DELETE /api/promotions
    case "savePromotion":
      return updateOutlet(state, (o) => {
        const exists = o.promotions.some((p) => p.id === action.promo.id);
        return { promotions: exists ? o.promotions.map((p) => (p.id === action.promo.id ? action.promo : p)) : [action.promo, ...o.promotions] };
      });
    case "deletePromotion":
      return updateOutlet(state, (o) => ({ promotions: o.promotions.filter((p) => p.id !== action.id) }));
    case "togglePromotion":
      return updateOutlet(state, (o) => ({ promotions: o.promotions.map((p) => (p.id === action.id ? { ...p, active: !p.active } : p)) }));

    // PUT /api/outlets/:id/settings
    case "updateSettings":
      return updateOutlet(state, (o) => ({ settings: { ...o.settings, ...action.patch } }));
    default:
      throw new Error(`Unknown action ${action.type}`);
  }
}

const StaffContext = createContext(null);

export function StaffProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // Load from localStorage after mount (avoids server/client hydration mismatch).
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    } catch {}
    dispatch({ type: "load", state: saved?.data ? saved : buildInitialState() });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const toast = useCallback((text, kind = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo(() => {
    if (!state) return null;
    const outlet = outlets.find((o) => o.id === state.outletId);
    const current = state.data[state.outletId];

    const actions = {
      setOutlet: (outletId) => dispatch({ type: "setOutlet", outletId }),
      setRole: (role) => dispatch({ type: "setRole", role }),
      reset: () => {
        dispatch({ type: "reset" });
        toast("Demo data reset");
      },
      advanceOrder: (order) => {
        const next = NEXT_STAGE[order.status];
        if (!next) return;
        dispatch({ type: "advanceOrder", id: order.id });
        if (next === "ready") toast(`#${order.number} ready. ${order.customer.name.split(" ")[0]} has been notified to collect.`);
        else toast(`#${order.number} moved to ${STATUS_LABELS[next]}`);
      },
      cancelOrder: (order, reason) => {
        dispatch({ type: "cancelOrder", id: order.id, reason });
        toast(`#${order.number} cancelled and refunded in full`, "warning");
      },
      resolveRefund: (order, approve, note) => {
        dispatch({ type: "resolveRefund", id: order.id, approve, note });
        toast(approve ? `Refund of $${order.refund.amount.toFixed(2)} approved for #${order.number}` : `Refund declined for #${order.number}`, approve ? "success" : "warning");
      },
      issueRefund: (order, amount, reason) => {
        dispatch({ type: "issueRefund", id: order.id, amount, reason });
        toast(`Refunded $${amount.toFixed(2)} on #${order.number}`);
      },
      simulateOrder: () => {
        const available = current.menu.filter((m) => m.available);
        if (!available.length) return toast("No available items to order", "warning");
        if (!current.settings.acceptingOrders) return toast("Online ordering is paused, so no new orders can come in", "warning");
        const customer = randomCustomer();
        const count = 1 + Math.floor(Math.random() * 2);
        const picks = [...available].sort(() => Math.random() - 0.5).slice(0, count);
        const items = picks.map((m) => makeOrderLine(m, 1 + Math.floor(Math.random() * 2), customer.tier));
        const now = Date.now();
        dispatch({
          type: "addOrder",
          order: {
            customer,
            items,
            total: orderTotal(items),
            placedAt: now,
            pickupAt: now + 20 * 60 * 1000,
            status: current.settings.autoAccept ? "preparing" : "received",
            pickupCode: makePickupCode(Math.random),
            payment: { method: "Card (sandbox)", status: "paid" },
            refund: null,
            note: "",
          },
        });
        toast(`New order #${state.nextOrderNumber} from ${customer.name}`, "info");
      },
      saveMenuItem: (item, isNew) => {
        dispatch({ type: "saveMenuItem", item });
        toast(isNew ? `${item.name} added to the menu` : `${item.name} updated`);
      },
      deleteMenuItem: (item) => {
        dispatch({ type: "deleteMenuItem", id: item.id });
        toast(`${item.name} removed from the menu`, "warning");
      },
      toggleAvailability: (item) => {
        dispatch({ type: "toggleAvailability", id: item.id });
        toast(`${item.name} marked ${item.available ? "unavailable" : "available"}`, item.available ? "warning" : "success");
      },
      savePromotion: (promo, isNew) => {
        dispatch({ type: "savePromotion", promo });
        toast(isNew ? `Promotion "${promo.title}" created` : `Promotion "${promo.title}" updated`);
      },
      deletePromotion: (promo) => {
        dispatch({ type: "deletePromotion", id: promo.id });
        toast(`Promotion "${promo.title}" deleted`, "warning");
      },
      togglePromotion: (promo) => {
        dispatch({ type: "togglePromotion", id: promo.id });
        toast(`"${promo.title}" ${promo.active ? "paused" : "activated"}`);
      },
      updateSettings: (patch, message) => {
        dispatch({ type: "updateSettings", patch });
        if (message) toast(message);
      },
    };

    return { ...state, outlet, outlets, ...current, actions, toast };
  }, [state, toast]);

  return (
    <StaffContext.Provider value={value}>
      {value ? children : <div className="page-loading">Loading outlet…</div>}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>{t.text}</div>
        ))}
      </div>
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error("useStaff must be used inside StaffProvider");
  return ctx;
}

// Re-render every `ms` so relative times ("3 min ago") stay fresh.
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
