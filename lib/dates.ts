import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  return format(date, "EEEE d MMM", { locale: fr });
}

export function formatDayHeading(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Aujourd'hui";
  if (isTomorrow(date)) return "Demain";
  return format(date, "EEEE d MMMM", { locale: fr });
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM", { locale: fr });
}

export function formatLongDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMMM yyyy", { locale: fr });
}
