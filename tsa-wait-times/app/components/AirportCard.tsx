"use client";

import type { AirportWaitData } from "@/lib/types";
import WaitBadge from "./WaitBadge";

interface AirportCardProps {
  data: AirportWaitData | null;
  loading: boolean;
}

const AIRPORT_META: Record<
  string,
  { city: string; state: string; emoji: string }
> = {
  LGA: { city: "New York", state: "NY", emoji: "🗽" },
  IAH: { city: "Houston", state: "TX", emoji: "🤠" },
};

function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
}

export default function AirportCard({ data, loading }: AirportCardProps) {
  const code = data?.airportCode ?? "???";
  const meta = AIRPORT_META[code];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-col gap-3 mt-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-red-100 p-6">
        <p className="text-red-600 font-medium">Failed to load airport data.</p>
      </div>
    );
  }

  const hasError = !!data.error;
  const hasData = data.checkpoints.length > 0;

  const formattedTime = new Date(data.lastUpdated).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight">{code}</span>
              {meta && (
                <span className="text-xl" aria-hidden="true">
                  {meta.emoji}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-blue-100 text-sm font-medium">
              {data.airportName}
            </p>
            {meta && (
              <p className="text-blue-200 text-xs mt-0.5">
                {meta.city}, {meta.state}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-blue-200">
            <p className="font-medium">Updated</p>
            <p>{formattedTime}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1">
        {hasError && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
            <span className="mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold">Live data unavailable</p>
              <p className="text-amber-700 text-xs mt-0.5">{data.error}</p>
              <a
                href={data.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-amber-800 underline underline-offset-2 hover:text-amber-900"
              >
                Check official site →
              </a>
            </div>
          </div>
        )}

        {hasData ? (
          <div className="flex flex-col gap-3">
            {data.checkpoints.map((cp, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {cp.name}
                  </p>
                  {cp.status === "closed" && (
                    <span className="mt-0.5 inline-block text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                      Closed
                    </span>
                  )}
                  {cp.status === "limited" && (
                    <span className="mt-0.5 inline-block text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                      Limited
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <WaitBadge minutes={cp.standardWaitMinutes} label="Standard" />
                  {cp.preCheckWaitMinutes !== null && (
                    <WaitBadge
                      minutes={cp.preCheckWaitMinutes}
                      label="PreCheck"
                    />
                  )}
                  {cp.clearWaitMinutes !== null &&
                    cp.clearWaitMinutes !== undefined && (
                      <WaitBadge minutes={cp.clearWaitMinutes} label="CLEAR" />
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !hasError && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="font-medium text-gray-500">No checkpoint data available</p>
              <a
                href={data.source}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-600 text-sm underline underline-offset-2 hover:text-blue-800"
              >
                View official wait times →
              </a>
            </div>
          )
        )}

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Wait levels:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ≤ 15 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            16–30 min
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            &gt; 30 min
          </span>
        </div>
      </div>
    </div>
  );
}
