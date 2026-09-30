export type TimeGranularity = "day" | "month";

export interface AnalyticsQuery {
    areaId?: number;
    start?: string;
    end?: string;
    granularity?: TimeGranularity;
    anonymous?: boolean;
}

function parseDateParam(value: unknown, label: string): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${label} no es una fecha válida`);
    }
    return date.toISOString();
}

function parseOptionalInt(value: unknown, label: string): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) {
        throw new Error(`${label} no es un número válido`);
    }
    return parsed;
}

export function loadAnalyticsQuery(query: unknown): AnalyticsQuery {
    const source = (query ?? {}) as Record<string, unknown>;

    let granularity: TimeGranularity = "day";
    if (source.granularity !== undefined) {
        if (source.granularity !== "day" && source.granularity !== "month") {
            throw new Error("granularity debe ser 'day' o 'month'");
        }
        granularity = source.granularity;
    }

    const result: AnalyticsQuery = { granularity };
    const areaId = parseOptionalInt(source.areaId, "areaId");
    const start = parseDateParam(source.start, "start");
    const end = parseDateParam(source.end, "end");

    if (areaId !== undefined) result.areaId = areaId;
    if (start !== undefined) result.start = start;
    if (end !== undefined) result.end = end;

    if (source.anonymous !== undefined) {
        result.anonymous = source.anonymous === true || source.anonymous === "true";
    }

    return result;
}