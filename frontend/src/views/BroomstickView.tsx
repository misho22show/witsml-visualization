import React, { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchJSON } from "../utils/api";
import { BroomstickBin } from "../utils/types";

interface Props {
  wellId: string;
  replayIndex: number;
}

const CARD: React.CSSProperties = {
  background: "#1a1f2e",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};

export default function BroomstickView({ wellId, replayIndex }: Props) {
  const [bins, setBins] = useState<BroomstickBin[]>([]);

  useEffect(() => {
    if (replayIndex % 5 === 0 || replayIndex === 0) {
      fetchJSON<BroomstickBin[]>(`/broomstick/${wellId}`).then(setBins).catch(() => {});
    }
  }, [wellId, replayIndex]);

  const pickupData = bins
    .filter((b) => b.pickup_hookload != null)
    .map((b) => ({ depth: b.depth_bin, hookload: b.pickup_hookload }));
  const slackoffData = bins
    .filter((b) => b.slackoff_hookload != null)
    .map((b) => ({ depth: b.depth_bin, hookload: b.slackoff_hookload }));
  const rotationData = bins
    .filter((b) => b.rotation_hookload != null)
    .map((b) => ({ depth: b.depth_bin, hookload: b.rotation_hookload }));

  return (
    <div>
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Broomstick Chart — Hookload vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis
              type="number"
              dataKey="hookload"
              name="Hookload"
              unit=" klbf"
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="depth"
              name="Depth"
              unit=" m"
              reversed
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Scatter name="Pickup" data={pickupData} fill="#38b2ac" />
            <Scatter name="Slack-Off" data={slackoffData} fill="#ed8936" />
            <Scatter name="Rotation" data={rotationData} fill="#9f7aea" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Torque broomstick */}
      <div style={CARD}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>
          Rotation Torque vs Depth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis
              type="number"
              dataKey="rotation_torque"
              name="Torque"
              unit=" kft·lbf"
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="depth_bin"
              name="Depth"
              unit=" m"
              reversed
              stroke="#718096"
              tick={{ fontSize: 10 }}
            />
            <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #4a5568" }} />
            <Scatter
              name="Rotation Torque"
              data={bins.filter((b) => b.rotation_torque != null)}
              fill="#f6ad55"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
