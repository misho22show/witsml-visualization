import React from "react";

interface GaugeProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  color: string;
  warningThreshold?: number;
  dangerThreshold?: number;
}

function Gauge({ label, value, unit, min, max, color, warningThreshold, dangerThreshold }: GaugeProps) {
  const displayVal = value ?? 0;
  const pct = Math.min(Math.max((displayVal - min) / (max - min), 0), 1);
  const angle = -135 + pct * 270; // sweep from -135 to +135 degrees
  const r = 38;
  const cx = 50;
  const cy = 52;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const needleX = cx + r * 0.82 * Math.cos(toRad(angle - 90));
  const needleY = cy + r * 0.82 * Math.sin(toRad(angle - 90));

  // Arc path for the track
  const arcPath = (startDeg: number, endDeg: number, radius: number) => {
    const s = toRad(startDeg - 90);
    const e = toRad(endDeg - 90);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy + radius * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  let activeColor = color;
  if (dangerThreshold != null && displayVal >= dangerThreshold) {
    activeColor = "#e53e3e";
  } else if (warningThreshold != null && displayVal >= warningThreshold) {
    activeColor = "#ed8936";
  }

  const endAngle = -135 + pct * 270;

  return (
    <div
      style={{
        background: "#141820",
        borderRadius: 8,
        padding: "10px 6px 6px",
        border: "1px solid #2d3748",
        textAlign: "center",
        minWidth: 120,
      }}
    >
      <svg viewBox="0 0 100 70" style={{ width: "100%", maxWidth: 140 }}>
        {/* Background arc */}
        <path
          d={arcPath(-135, 135, r)}
          fill="none"
          stroke="#2d3748"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Active arc */}
        {pct > 0.005 && (
          <path
            d={arcPath(-135, endAngle, r)}
            fill="none"
            stroke={activeColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
        )}
        {/* Tick marks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const a = toRad(-135 + t * 270 - 90);
          const ix = cx + (r + 3) * Math.cos(a);
          const iy = cy + (r + 3) * Math.sin(a);
          const ox = cx + (r + 7) * Math.cos(a);
          const oy = cy + (r + 7) * Math.sin(a);
          return (
            <line
              key={t}
              x1={ix} y1={iy} x2={ox} y2={oy}
              stroke="#4a5568" strokeWidth={1.2}
            />
          );
        })}
        {/* Needle */}
        <line
          x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke="#e2e8f0" strokeWidth={1.8} strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={3} fill="#e2e8f0" />
        {/* Value */}
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#fff" fontSize={12} fontWeight={700}>
          {value != null ? displayVal.toFixed(0) : "—"}
        </text>
      </svg>
      <div style={{ fontSize: 10, color: "#a0aec0", marginTop: -2 }}>{unit}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 2 }}>{label}</div>
    </div>
  );
}

interface GaugePanelProps {
  hookload: number | null;
  rop: number | null;
  flowRate: number | null;
  spp: number | null;
  torque: number | null;
}

export default function GaugePanel({ hookload, rop, flowRate, spp, torque }: GaugePanelProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
      <Gauge
        label="ROP"
        value={rop}
        unit="ft/hr"
        min={0}
        max={400}
        color="#48bb78"
        warningThreshold={250}
        dangerThreshold={350}
      />
      <Gauge
        label="Hook Load"
        value={hookload}
        unit="klbf"
        min={0}
        max={500}
        color="#38b2ac"
        warningThreshold={350}
        dangerThreshold={400}
      />
      <Gauge
        label="Flow Rate"
        value={flowRate}
        unit="gpm"
        min={0}
        max={1200}
        color="#63b3ed"
        warningThreshold={800}
        dangerThreshold={1000}
      />
      <Gauge
        label="SPP"
        value={spp}
        unit="psi"
        min={0}
        max={5000}
        color="#ed8936"
        warningThreshold={3500}
        dangerThreshold={4000}
      />
      <Gauge
        label="Torque"
        value={torque}
        unit="kft·lbf"
        min={0}
        max={50}
        color="#f6ad55"
        warningThreshold={30}
        dangerThreshold={40}
      />
    </div>
  );
}
