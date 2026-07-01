"use client";

import { getWaitLevel } from "@/lib/types";

interface WaitBadgeProps {
  minutes: number | null;
  label?: string;
}

const levelConfig = {
  low: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Low",
  },
  moderate: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Moderate",
  },
  high: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
    label: "High",
  },
  unknown: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
    label: "N/A",
  },
};

export default function WaitBadge({ minutes, label }: WaitBadgeProps) {
  const level = getWaitLevel(minutes);
  const cfg = levelConfig[level];

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
        {minutes !== null ? `${minutes} min` : cfg.label}
      </div>
    </div>
  );
}
