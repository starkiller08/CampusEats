"use client";

import { useState } from "react";

function niceMax(v) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}

// Single-series column chart built from plain HTML so it stays responsive.
// data: [{ key, label, value, tooltip, muted }]
export default function BarChart({ data, format = (v) => v, height = 240, labelEvery = 1, highlight, ariaLabel }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);

  return (
    <div className="bar-chart" role="img" aria-label={ariaLabel}>
      <div className="bar-axis" style={{ height }}>
        {ticks.slice().reverse().map((t) => <span key={t}>{format(t)}</span>)}
      </div>
      <div className="bar-plot" style={{ height }} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => <div key={t} className="bar-grid" style={{ bottom: `${(t / max) * 100}%` }} />)}
        <div className="bar-cols">
          {data.map((d, i) => (
            <div
              key={d.key}
              className={`bar-col ${hover === i ? "is-hover" : ""}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={d.tooltip}
            >
              <div
                className={`bar ${d.muted ? "is-muted" : ""} ${highlight === d.key ? "is-peak" : ""}`}
                style={{ height: `${(d.value / max) * 100}%` }}
              />
              {hover === i && <div className="bar-tip">{d.tooltip}</div>}
            </div>
          ))}
        </div>
      </div>
      <div />
      <div className="bar-labels">
        {data.map((d, i) => <span key={d.key}>{i % labelEvery === 0 ? d.label : ""}</span>)}
      </div>
    </div>
  );
}
