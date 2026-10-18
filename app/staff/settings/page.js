"use client";

import { useState } from "react";
import Icon from "@/components/staff/Icon";
import { ConfirmDialog, PageHeader, Toggle } from "@/components/staff/ui";
import { useStaff } from "@/lib/staff/StaffStore";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SettingRow({ title, desc, children }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <p className="muted">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { outlet, settings, role, actions } = useStaff();
  const [hours, setHours] = useState(settings.hours);
  const [resetting, setResetting] = useState(false);
  const isOwner = role === "owner";
  const dirty = JSON.stringify(hours) !== JSON.stringify(settings.hours);
  const invalidDay = DAYS.find((d) => hours[d] && hours[d][0] >= hours[d][1]);

  const setDay = (d, idx, v) => setHours((h) => ({ ...h, [d]: idx == null ? (h[d] ? null : ["08:00", "16:00"]) : h[d].map((x, i) => (i === idx ? v : x)) }));

  return (
    <>
      <PageHeader title="Settings" subtitle={`${outlet.name} · ${outlet.building}, ${outlet.campus} campus`} />

      <div className="grid grid-2">
        <section className="card card-pad">
          <div className="card-head"><h2><Icon name="orders" /> Ordering</h2></div>
          <SettingRow title="Accept online orders" desc="Turn off to pause new orders during a rush or before closing.">
            <Toggle label="Accept online orders" checked={settings.acceptingOrders} onChange={() => actions.updateSettings({ acceptingOrders: !settings.acceptingOrders }, settings.acceptingOrders ? "Online ordering paused" : "Online ordering resumed")} />
          </SettingRow>
          <SettingRow title="Auto-accept new orders" desc="Paid orders go straight to Preparing without a staff tap.">
            <Toggle label="Auto-accept orders" checked={settings.autoAccept} onChange={() => actions.updateSettings({ autoAccept: !settings.autoAccept }, `Auto-accept ${settings.autoAccept ? "off" : "on"}`)} />
          </SettingRow>
          <SettingRow title="Pickup slot length" desc="Customers choose a pickup time in these intervals.">
            <select className="select" style={{ width: 120 }} value={settings.pickupSlotMins} disabled={!isOwner} onChange={(e) => actions.updateSettings({ pickupSlotMins: Number(e.target.value) }, "Pickup slot updated")}>
              {[5, 10, 15, 20].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </SettingRow>
          <SettingRow title="Max orders per slot" desc="Stops a slot being overbooked; customers are offered the next one.">
            <input className="input num" style={{ width: 90 }} type="number" min="1" max="50" value={settings.maxOrdersPerSlot} disabled={!isOwner} onChange={(e) => actions.updateSettings({ maxOrdersPerSlot: Math.max(1, Number(e.target.value) || 1) })} />
          </SettingRow>
        </section>

        <section className="card card-pad">
          <div className="card-head">
            <h2><Icon name="clock" /> Opening hours</h2>
            {isOwner && (
              <button className="btn btn-primary btn-sm" disabled={!dirty || !!invalidDay} onClick={() => actions.updateSettings({ hours }, "Opening hours saved")}>Save hours</button>
            )}
          </div>
          <div className="hours">
            {DAYS.map((d) => (
              <div key={d} className="hours-row">
                <strong>{d}</strong>
                <Toggle label={`Open on ${d}`} checked={!!hours[d]} onChange={() => isOwner && setDay(d)} />
                {hours[d] ? (
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <input className={`input ${invalidDay === d ? "is-invalid" : ""}`} type="time" value={hours[d][0]} disabled={!isOwner} onChange={(e) => setDay(d, 0, e.target.value)} aria-label={`${d} opening time`} />
                    <span className="muted">to</span>
                    <input className={`input ${invalidDay === d ? "is-invalid" : ""}`} type="time" value={hours[d][1]} disabled={!isOwner} onChange={(e) => setDay(d, 1, e.target.value)} aria-label={`${d} closing time`} />
                  </div>
                ) : (
                  <span className="muted">Closed</span>
                )}
              </div>
            ))}
          </div>
          {invalidDay && <p className="error-text" style={{ marginTop: 8 }}>{invalidDay}: closing time must be after opening time.</p>}
          {!isOwner && <p className="muted" style={{ marginTop: 8 }}>Only the outlet owner can change hours.</p>}
        </section>
      </div>

      <section className="card card-pad" style={{ marginTop: 16 }}>
        <SettingRow title="Reset prototype data" desc="Restores the sample orders, menu and promotions for every outlet. Use before a demo.">
          <button className="btn btn-danger-soft" onClick={() => setResetting(true)}><Icon name="refund" size={16} /> Reset demo data</button>
        </SettingRow>
      </section>

      {resetting && (
        <ConfirmDialog danger title="Reset demo data?" message="All changes made in this browser will be replaced with the original sample data." confirmLabel="Reset" onConfirm={actions.reset} onClose={() => setResetting(false)} />
      )}
    </>
  );
}
