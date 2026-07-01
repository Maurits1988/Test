export interface Checkpoint {
  name: string;
  terminalOrConcourse?: string;
  standardWaitMinutes: number | null;
  preCheckWaitMinutes: number | null;
  clearWaitMinutes?: number | null;
  status?: "open" | "closed" | "limited";
}

export interface AirportWaitData {
  airportCode: string;
  airportName: string;
  checkpoints: Checkpoint[];
  lastUpdated: string;
  source: string;
  error?: string;
}

export type WaitLevel = "low" | "moderate" | "high" | "unknown";

export function getWaitLevel(minutes: number | null): WaitLevel {
  if (minutes === null) return "unknown";
  if (minutes <= 15) return "low";
  if (minutes <= 30) return "moderate";
  return "high";
}
