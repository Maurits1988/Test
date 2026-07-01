import type { AirportWaitData, Checkpoint } from "./types";

const IAH_API =
  "https://api.houstonairports.mobi/wait-times/checkpoint/iah";
const LGA_PAGE =
  "https://www.laguardiaairport.com/at-the-airport/tsa-wait-times";

// Free CORS proxies – tried in order until one responds
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function corsGet(targetUrl: string): Promise<string> {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const res = await fetch(makeProxy(targetUrl), {
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return await res.text();
    } catch {
      // try next proxy
    }
  }
  throw new Error("All CORS proxies failed");
}

function parseMinutes(text: string): number | null {
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ── IAH ─────────────────────────────────────────────────────────────────────

interface HoustonItem {
  checkpointName?: string;
  name?: string;
  terminal?: string;
  standardWait?: number;
  waitTime?: number;
  preCheckWait?: number;
  preCheck?: number;
  clearWait?: number;
  status?: string;
  [k: string]: unknown;
}

function parseIAH(raw: unknown): Checkpoint[] {
  const items: HoustonItem[] = Array.isArray(raw)
    ? (raw as HoustonItem[])
    : ((raw as Record<string, unknown>)?.checkpoints as HoustonItem[]) ??
      ((raw as Record<string, unknown>)?.data as HoustonItem[]) ??
      [];

  return items.map((item) => ({
    name:
      item.checkpointName ??
      item.name ??
      item.terminal ??
      "Unknown Checkpoint",
    terminalOrConcourse: item.terminal,
    standardWaitMinutes: item.standardWait ?? item.waitTime ?? null,
    preCheckWaitMinutes: item.preCheckWait ?? item.preCheck ?? null,
    clearWaitMinutes: item.clearWait ?? null,
    status:
      item.status === "closed"
        ? "closed"
        : item.status === "limited"
        ? "limited"
        : "open",
  }));
}

export async function fetchIAH(): Promise<AirportWaitData> {
  const base: Omit<AirportWaitData, "checkpoints" | "error"> = {
    airportCode: "IAH",
    airportName: "George Bush Intercontinental Airport",
    lastUpdated: new Date().toISOString(),
    source: "https://www.fly2houston.com/iah/security/",
  };

  // 1. Try direct fetch (works when the API has open CORS or same-origin rules
  //    aren't enforced by the server).
  try {
    const res = await fetch(IAH_API, {
      headers: { Accept: "application/json, text/plain, */*" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const raw = await res.json();
      const checkpoints = parseIAH(raw);
      if (checkpoints.length > 0) {
        return { ...base, checkpoints };
      }
    }
  } catch {
    // fall through to proxy
  }

  // 2. Try via CORS proxy
  try {
    const text = await corsGet(IAH_API);
    const raw = JSON.parse(text);
    const checkpoints = parseIAH(raw);
    if (checkpoints.length > 0) {
      return { ...base, checkpoints };
    }
    throw new Error("Parsed 0 checkpoints");
  } catch (err) {
    return {
      ...base,
      checkpoints: [],
      error: `Unable to load live data: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── LGA ─────────────────────────────────────────────────────────────────────

function parseLGAHtml(html: string): Checkpoint[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const checkpoints: Checkpoint[] = [];

  // Pattern 1: <table> rows with terminal name + wait text
  doc.querySelectorAll("table tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 2) {
      const label = cells[0].textContent?.trim() ?? "";
      const waitText = cells[1].textContent?.trim() ?? "";
      const minutes = parseMinutes(waitText);
      if (label && minutes !== null) {
        checkpoints.push({ name: label, standardWaitMinutes: minutes, preCheckWaitMinutes: null });
      }
    }
  });

  // Pattern 2: elements whose class name contains wait/terminal/checkpoint
  if (checkpoints.length === 0) {
    doc
      .querySelectorAll("[class*='wait'],[class*='terminal'],[class*='checkpoint']")
      .forEach((el) => {
        const text = el.textContent ?? "";
        const terminal = text.match(/(Terminal\s+[A-Z\d]+)/i);
        const mins = text.match(/(\d+)\s*min/i);
        if (terminal && mins) {
          checkpoints.push({
            name: terminal[1],
            standardWaitMinutes: parseInt(mins[1], 10),
            preCheckWaitMinutes: null,
          });
        }
      });
  }

  // Pattern 3: body text regex scan
  if (checkpoints.length === 0) {
    const body = doc.body?.textContent ?? "";
    const re = /Terminal\s+([A-Z\d]+)[^0-9]{0,40}?(\d+)\s*min/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      checkpoints.push({
        name: `Terminal ${m[1]}`,
        standardWaitMinutes: parseInt(m[2], 10),
        preCheckWaitMinutes: null,
      });
    }
  }

  return checkpoints;
}

export async function fetchLGA(): Promise<AirportWaitData> {
  const base: Omit<AirportWaitData, "checkpoints" | "error"> = {
    airportCode: "LGA",
    airportName: "LaGuardia Airport",
    lastUpdated: new Date().toISOString(),
    source: LGA_PAGE,
  };

  try {
    const html = await corsGet(LGA_PAGE);
    const checkpoints = parseLGAHtml(html);
    if (checkpoints.length === 0) {
      throw new Error(
        "No wait time data found — the page layout may have changed"
      );
    }
    return { ...base, checkpoints };
  } catch (err) {
    return {
      ...base,
      checkpoints: [],
      error: `Unable to load live data: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
