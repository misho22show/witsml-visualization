import React from "react";

const COLORS: Record<string, string> = {
  High: "#38b2ac",
  Medium: "#ed8936",
  Low: "#e53e3e",
};

interface Props {
  level: string;
  size?: "sm" | "md";
}

export default function ConfidenceBadge({ level, size = "sm" }: Props) {
  const bg = COLORS[level] ?? "#718096";
  const px = size === "sm" ? "6px 10px" : "8px 14px";
  const fs = size === "sm" ? 11 : 13;

  return (
    <span
      style={{
        display: "inline-block",
        padding: px,
        borderRadius: 4,
        background: bg,
        color: "#fff",
        fontSize: fs,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {level}
    </span>
  );
}
