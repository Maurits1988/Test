import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { AirportWaitData, Checkpoint } from "@/lib/types";

export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(
      "https://www.laguardiaairport.com/at-the-airport/tsa-wait-times",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      throw new Error(`LGA website returned ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const checkpoints: Checkpoint[] = [];

    // LGA website shows wait times per terminal; try multiple selector patterns
    // Pattern 1: table rows
    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim();
        const waitText = $(cells[1]).text().trim();
        const minutes = parseMinutes(waitText);
        if (label && minutes !== null) {
          checkpoints.push({
            name: label,
            standardWaitMinutes: minutes,
            preCheckWaitMinutes: null,
          });
        }
      }
    });

    // Pattern 2: named blocks / cards
    if (checkpoints.length === 0) {
      $("[class*='wait'], [class*='terminal'], [class*='checkpoint']").each(
        (_, el) => {
          const text = $(el).text().trim();
          const terminalMatch = text.match(/(Terminal\s+[A-Z\d]+)/i);
          const minutesMatch = text.match(/(\d+)\s*min/i);
          if (terminalMatch && minutesMatch) {
            checkpoints.push({
              name: terminalMatch[1],
              standardWaitMinutes: parseInt(minutesMatch[1], 10),
              preCheckWaitMinutes: null,
            });
          }
        }
      );
    }

    // Pattern 3: look for any element containing "Terminal" next to a time value
    if (checkpoints.length === 0) {
      const bodyText = $("body").text();
      const pattern = /Terminal\s+([A-Z\d]+)[^\d]*(\d+)\s*min/gi;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(bodyText)) !== null) {
        checkpoints.push({
          name: `Terminal ${match[1]}`,
          standardWaitMinutes: parseInt(match[2], 10),
          preCheckWaitMinutes: null,
        });
      }
    }

    if (checkpoints.length === 0) {
      throw new Error(
        "Could not parse wait time data from LGA website — page layout may have changed"
      );
    }

    const data: AirportWaitData = {
      airportCode: "LGA",
      airportName: "LaGuardia Airport",
      checkpoints,
      lastUpdated: new Date().toISOString(),
      source: "https://www.laguardiaairport.com/at-the-airport/tsa-wait-times",
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const fallback: AirportWaitData = {
      airportCode: "LGA",
      airportName: "LaGuardia Airport",
      checkpoints: [],
      lastUpdated: new Date().toISOString(),
      source: "https://www.laguardiaairport.com/at-the-airport/tsa-wait-times",
      error: `Unable to fetch live data: ${message}`,
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}

function parseMinutes(text: string): number | null {
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}
