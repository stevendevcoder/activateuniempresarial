export function parsePositiveInt(value: unknown, label = "id"): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        throw new Error(`${label} inválido`);
    }
    return parsed;
}
