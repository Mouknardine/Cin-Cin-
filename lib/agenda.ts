import type { Screening } from "@/lib/types";

export interface AgendaDay {
  date: string;
  screenings: Screening[];
}

export function groupByDate(screenings: Screening[]): AgendaDay[] {
  const map = new Map<string, Screening[]>();
  for (const s of screenings) {
    const list = map.get(s.date) || [];
    list.push(s);
    map.set(s.date, list);
  }
  const days = Array.from(map.entries()).map(([date, list]) => ({
    date,
    screenings: list.sort((a, b) => a.time.localeCompare(b.time)),
  }));
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
