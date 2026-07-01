import { NextResponse } from "next/server";
import type { AirportWaitData, Checkpoint } from "@/lib/types";

export const revalidate = 0;

interface HoustonCheckpoint {
  checkpointName?: string;
  name?: string;
  terminal?: string;
  standardWait?: number;
  waitTime?: number;
  preCheckWait?: number;
  preCheck?: number;
  clearWait?: number;
  status?: string;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.houstonairports.mobi/wait-times/checkpoint/iah",
      {
        headers: {
          Referer: "https://www.fly2houston.com/iah/security/",
          Origin: "https://www.fly2houston.com",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      throw new Error(`Houston Airports API returned ${res.status}`);
    }

    const raw = await res.json();

    const items: HoustonCheckpoint[] = Array.isArray(raw)
      ? raw
      : raw.checkpoints ?? raw.data ?? [];

    const checkpoints: Checkpoint[] = items.map((item) => ({
      name:
        item.checkpointName ??
        item.name ??
        item.terminal ??
        "Unknown Checkpoint",
      terminalOrConcourse: item.terminal,
      standardWaitMinutes:
        item.standardWait ?? item.waitTime ?? null,
      preCheckWaitMinutes: item.preCheckWait ?? item.preCheck ?? null,
      clearWaitMinutes: item.clearWait ?? null,
      status:
        item.status === "closed"
          ? "closed"
          : item.status === "limited"
          ? "limited"
          : "open",
    }));

    const data: AirportWaitData = {
      airportCode: "IAH",
      airportName: "George Bush Intercontinental Airport",
      checkpoints,
      lastUpdated: new Date().toISOString(),
      source: "https://www.fly2houston.com/iah/security/",
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const fallback: AirportWaitData = {
      airportCode: "IAH",
      airportName: "George Bush Intercontinental Airport",
      checkpoints: [],
      lastUpdated: new Date().toISOString(),
      source: "https://www.fly2houston.com/iah/security/",
      error: `Unable to fetch live data: ${message}`,
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
