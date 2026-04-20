export const APP_TZ = "Europe/London";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Returns the Monday (local) of the week the given date falls in, at 00:00 local → UTC. */
export function weekStartUtc(at: Date): Date {
  // Compute offset to Monday in the user's *device* time zone, which is close
  // enough for scheduling — the server does the authoritative formatting in
  // Europe/London.
  const local = new Date(at);
  const day = local.getDay(); // 0=Sun … 6=Sat
  const offset = (day + 6) % 7;
  local.setDate(local.getDate() - offset);
  local.setHours(0, 0, 0, 0);
  return local;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

export function formatHM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatWeekdayDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
