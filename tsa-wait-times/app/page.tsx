"use client";

import { useEffect, useRef, useState } from "react";
import type { AirportWaitData } from "@/lib/types";
import AirportCard from "./components/AirportCard";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const COUNTDOWN_SECS = REFRESH_INTERVAL_MS / 1000;

export default function Home() {
  const [lgaData, setLgaData] = useState<AirportWaitData | null>(null);
  const [iahData, setIahData] = useState<AirportWaitData | null>(null);
  // Start as true so the fetch effect doesn't need a synchronous setLoading(true)
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const abortRef = useRef<AbortController | null>(null);

  // Data fetching – all setState calls happen asynchronously (after awaits)
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    void (async () => {
      try {
        const [lgaRes, iahRes] = await Promise.all([
          fetch("/api/lga", { signal: controller.signal }),
          fetch("/api/iah", { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        const [lga, iah]: [AirportWaitData, AirportWaitData] = await Promise.all(
          [lgaRes.json(), iahRes.json()]
        );
        setLgaData(lga);
        setIahData(iah);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch wait times:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [refreshCount]);

  // Combined countdown + auto-refresh — all setState calls happen inside the
  // setInterval callback, not synchronously in the effect body.
  useEffect(() => {
    let secs = COUNTDOWN_SECS;

    const id = setInterval(() => {
      secs -= 1;
      setCountdown(secs);

      if (secs <= 0) {
        secs = COUNTDOWN_SECS;
        setCountdown(COUNTDOWN_SECS);
        setLoading(true);
        setRefreshCount((c) => c + 1);
      }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Manual refresh — setState called in an event handler, not an effect
  const handleRefresh = () => {
    setCountdown(COUNTDOWN_SECS);
    setLoading(true);
    setRefreshCount((c) => c + 1);
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const countdownLabel = `${mins}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">✈️</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              TSA Wait Times
            </span>
            <span className="hidden sm:inline text-gray-400 text-sm font-medium ml-1">
              — LGA &amp; IAH
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Auto-refresh in {countdownLabel}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              aria-label="Refresh wait times"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Live TSA Security Wait Times
          </h1>
          <p className="mt-3 text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
            Real-time security checkpoint wait times for LaGuardia (LGA) and
            George Bush Intercontinental (IAH). Data updates every 5 minutes.
          </p>
        </div>

        {/* Airport cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AirportCard data={lgaData} loading={loading} />
          <AirportCard data={iahData} loading={loading} />
        </div>

        {/* Tips */}
        <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true">💡</span> Travel Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p>
                <span className="font-medium text-gray-800">Arrive early.</span>{" "}
                TSA recommends 2 hours before domestic flights, 3 hours for
                international.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <p>
                <span className="font-medium text-gray-800">TSA PreCheck &amp; CLEAR</span>{" "}
                significantly reduce wait times. Both airports have dedicated
                lanes.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p>
                <span className="font-medium text-gray-800">Peak hours</span>{" "}
                at LGA are typically 7:30–9:30 AM and 4:30–6:30 PM on weekdays.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-400 pb-6">
          <p>
            Data sourced from{" "}
            <a
              href="https://www.fly2houston.com/iah/security/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Houston Airports
            </a>{" "}
            and{" "}
            <a
              href="https://www.laguardiaairport.com/at-the-airport/tsa-wait-times"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              LaGuardia Airport
            </a>
            . Wait times are estimates and may vary.
          </p>
        </footer>
      </main>
    </div>
  );
}
