export function formatTimeInTz(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

export function formatDateInTz(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

export function weekdayInTz(date: Date, timeZone: string): number {
    const name = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[name] ?? 0;
}

export function minutesFromTime(value: string): number {
    const [h, m] = value.split(":");
    const hours = Number.parseInt(h ?? "0", 10);
    const minutes = Number.parseInt(m ?? "0", 10);
    return hours * 60 + minutes;
}

export function isWithinRange(time: string, start: string, end: string): boolean {
    const value = minutesFromTime(time);
    const from = minutesFromTime(start);
    const to = minutesFromTime(end);
    if (from <= to) {
        return value >= from && value < to;
    }
    return value >= from || value < to;
}

export function minutesToTime(minutes: number): string {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function tzOffsetMinutes(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const map: Record<string, string> = {};
    for (const part of parts) {
        map[part.type] = part.value;
    }

    const asUtc = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour) % 24,
        Number(map.minute),
        Number(map.second)
    );
    return (asUtc - date.getTime()) / 60000;
}

export function zonedDateTime(dateStr: string, timeStr: string, timeZone: string): Date {
    const guess = new Date(`${dateStr}T${timeStr}:00Z`);
    const offset = tzOffsetMinutes(guess, timeZone);
    return new Date(guess.getTime() - offset * 60000);
}

