"use client";

import { useState } from "react";
import Icon from "./Icon";
import { Modal, RefundPill, StatusPill } from "./ui";
import { useStaff } from "@/lib/staff/StaffStore";
import { ORDER_STAGES, STATUS_LABELS, TIERS } from "@/lib/staff/mockData";
import { ago, clock, money } from "@/lib/staff/format";

const ACTION_LABEL = { received: "Accept order", preparing: "Mark ready", ready: "Confirm pickup" };
const ACTION_ICON = { received: "check", preparing: "bell", ready: "bag" };

// Primary "next step" button for an order. Pickup asks for the customer's code.
export function AdvanceButton({ order, size = "sm", block }) {
  const { actions } = useStaff();
  const [collecting, setCollecting] = useState(false);
  if (!ACTION_LABEL[order.status]) return null;
  const onClick = () => (order.status === "ready" ? setCollecting(true) : actions.advanceOrder(order));
  return (
    <>
      <button className={`btn btn-primary btn-${size} ${block ? "btn-block" : ""}`} onClick={onClick}>
        <Icon name={ACTION_ICON[order.status]} size={16} />
        {ACTION_LABEL[order.status]}
      </button>
      {collecting && <CollectDialog order={order} onClose={() => setCollecting(false)} />}
    </>
  );
}

export function CollectDialog({ order, onClose }) {
  const { actions } = useStaff();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (code.trim() !== order.pickupCode) {
      setError("Code doesn't match. Ask the customer to show the code in their order screen.");
      return;
    }
    actions.advanceOrder(order);
    onClose();
  };
  return (
    <Modal
      title={`Confirm pickup · #${order.number}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="collect-form" type="submit">Complete order</button>
        </>
      }
    >
      <form id="collect-form" onSubmit={submit} className="stack">
        <p>Ask <strong>{order.customer.name}</strong> for the 4-digit pickup code shown in their CampusEats app.</p>
        <label className="field">
          <span>Pickup code</span>
          <input
            className={`input num ${error ? "is-invalid" : ""}`}
            inputMode="numeric"
            maxLength={4}
            autoFocus
            value={code}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
            placeholder="e.g. 4821"
          />
          {error && <span className="error-text">{error}</span>}
          <small>Prototype hint: this order's code is {order.pickupCode}.</small>
        </label>
      </form>
    </Modal>
  );
}

const CANCEL_REASONS = ["Item out of stock", "Kitchen too busy", "Customer requested", "Outlet closing early", "Other"];

export function CancelDialog({ order, onClose }) {
  const { actions } = useStaff();
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  return (
    <Modal
      title={`Cancel order #${order.number}?`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Keep order</button>
          <button className="btn btn-danger" onClick={() => { actions.cancelOrder(order, reason); onClose(); }}>
            Cancel & refund {money(order.total)}
          </button>
        </>
      }
    >
      <p>The customer gets a full refund to their original payment method and a notification with the reason.</p>
      <label className="field">
        <span>Reason</span>
        <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
          {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
    </Modal>
  );
}

export function RefundReviewDialog({ order, onClose }) {
  const { actions } = useStaff();
  const [note, setNote] = useState("");
  const decide = (approve) => { actions.resolveRefund(order, approve, note); onClose(); };
  return (
    <Modal
      title={`Refund request · #${order.number}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger-soft" onClick={() => decide(false)}>Decline</button>
          <button className="btn btn-primary" onClick={() => decide(true)}>Approve {money(order.refund.amount)}</button>
        </>
      }
    >
      <dl className="kv">
        <dt>Customer</dt><dd>{order.customer.name}</dd>
        <dt>Order total</dt><dd>{money(order.total)}</dd>
        <dt>Requested</dt><dd>{money(order.refund.amount)} · {ago(order.refund.requestedAt)}</dd>
        <dt>Reason</dt><dd>"{order.refund.reason}"</dd>
      </dl>
      <label className="field">
        <span>Note to customer (optional)</span>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sorry about that, refund is on its way." />
      </label>
    </Modal>
  );
}

export function IssueRefundDialog({ order, onClose }) {
  const { actions } = useStaff();
  const [amount, setAmount] = useState(order.total.toFixed(2));
  const [reason, setReason] = useState("");
  const value = Number(amount);
  const invalid = !(value > 0 && value <= order.total);
  return (
    <Modal
      title={`Issue refund · #${order.number}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={invalid || !reason.trim()} onClick={() => { actions.issueRefund(order, value, reason.trim()); onClose(); }}>
            Refund {invalid ? "" : money(value)}
          </button>
        </>
      }
    >
      <label className="field">
        <span>Amount (max {money(order.total)})</span>
        <input className={`input num ${invalid ? "is-invalid" : ""}`} type="number" step="0.01" min="0" max={order.total} value={amount} onChange={(e) => setAmount(e.target.value)} />
        {invalid && <span className="error-text">Enter an amount between $0.01 and {money(order.total)}.</span>}
      </label>
      <label className="field">
        <span>Reason</span>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Missing item" />
      </label>
    </Modal>
  );
}

function Timeline({ status }) {
  const idx = ORDER_STAGES.indexOf(status);
  return (
    <ol className="timeline">
      {ORDER_STAGES.map((s, i) => (
        <li key={s} className={status === "cancelled" ? "" : i < idx ? "is-done" : i === idx ? "is-current" : ""}>
          <span className="timeline-dot">{i < idx || (i === idx && s === "completed") ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}</span>
          <span>{STATUS_LABELS[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderDetailsDialog({ order, onClose }) {
  const [sub, setSub] = useState(null);
  const active = ["received", "preparing", "ready"].includes(order.status);
  return (
    <>
      <Modal
        wide
        title={`Order #${order.number}`}
        onClose={onClose}
        footer={
          <>
            {active && <button className="btn btn-danger-soft" onClick={() => setSub("cancel")}>Cancel order</button>}
            {order.refund?.status === "requested" && <button className="btn btn-danger-soft" onClick={() => setSub("review")}><Icon name="refund" size={16} />Review refund</button>}
            {order.status === "completed" && !order.refund && <button className="btn btn-ghost" onClick={() => setSub("issue")}><Icon name="refund" size={16} />Issue refund</button>}
            <span className="spacer" />
            <AdvanceButton order={order} size="md" />
          </>
        }
      >
        <div className="row">
          <StatusPill status={order.status} />
          <RefundPill refund={order.refund} />
          <span className="muted">Placed {clock(order.placedAt)} · {ago(order.placedAt)}</span>
        </div>
        {order.status !== "cancelled" ? <Timeline status={order.status} /> : <div className="alert-row alert-red">Cancelled: {order.cancelReason || "by outlet"}. Customer refunded in full.</div>}
        <div className="grid grid-2">
          <dl className="kv">
            <dt>Customer</dt><dd>{order.customer.name}</dd>
            <dt>Email</dt><dd>{order.customer.email}</dd>
            <dt>Account tier</dt><dd>{TIERS[order.customer.tier]}</dd>
          </dl>
          <dl className="kv">
            <dt>Pickup time</dt><dd>{clock(order.pickupAt)}</dd>
            <dt>Pickup code</dt><dd className="num">{order.pickupCode}</dd>
            <dt>Payment</dt><dd>{order.payment.method} · {order.payment.status}</dd>
          </dl>
        </div>
        {order.note && <div className="alert-row alert-amber"><Icon name="alert" size={18} />Customer note: "{order.note}"</div>}
        <table className="line-items">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.menuId}>
                <td>{i.emoji} {i.name}</td>
                <td className="num">× {i.qty}</td>
                <td className="num">{money(i.unitPrice * i.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td>Total</td><td /><td className="num">{money(order.total)}</td></tr>
            {order.refund?.status === "approved" && <tr className="refund-line"><td>Refunded</td><td /><td className="num">−{money(order.refund.amount)}</td></tr>}
          </tfoot>
        </table>
        {order.refund && (
          <div className={`alert-row ${order.refund.status === "requested" ? "alert-red" : "alert-blue"}`}>
            <Icon name="refund" size={18} />
            <span>
              Refund {order.refund.status}{order.refund.byStaff ? " by staff" : ""}: {money(order.refund.amount)}. "{order.refund.reason}"
              {order.refund.staffNote ? ` Note: ${order.refund.staffNote}` : ""}
            </span>
          </div>
        )}
      </Modal>
      {sub === "cancel" && <CancelDialog order={order} onClose={() => { setSub(null); onClose(); }} />}
      {sub === "review" && <RefundReviewDialog order={order} onClose={() => setSub(null)} />}
      {sub === "issue" && <IssueRefundDialog order={order} onClose={() => setSub(null)} />}
    </>
  );
}

// Keeps a selected order in sync with the store after actions change it.
export function useOrderDialog(orders) {
  const [openId, setOpenId] = useState(null);
  const order = orders.find((o) => o.id === openId);
  const dialog = order ? <OrderDetailsDialog order={order} onClose={() => setOpenId(null)} /> : null;
  return [setOpenId, dialog];
}
