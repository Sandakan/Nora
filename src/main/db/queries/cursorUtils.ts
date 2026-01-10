/**
 * Encodes cursor values as URI-safe string for deterministic pagination.
 * Format: "column1:value1|column2:value2"
 * Example: "createdAt:2024-01-09T10:30:00.000Z|id:123"
 *
 * @param values - Object with cursor column names and their values
 * @returns Base cursor string with URI-encoded values
 */
export function encodeCursor(values: Record<string, unknown>): string {
    const parts = Object.entries(values).map(([key, value]) => {
        const stringValue = value instanceof Date
            ? value.toISOString()
            : value === null || value === undefined
            ? ""
            : String(value);
        return `${key}:${encodeURIComponent(stringValue)}`;
    });

    return parts.join("|");
}

/**
 * Decodes URI-encoded cursor string back to object.
 *
 * @param cursor - Encoded cursor string
 * @returns Object with column names and decoded string values
 */
export function decodeCursor(cursor: string): Record<string, string> {
    const parts = cursor.split("|");
    const result: Record<string, string> = {};

    for (const part of parts) {
        const colonIndex = part.indexOf(":");
        if (colonIndex === -1) continue;

        const key = part.substring(0, colonIndex);
        const encodedValue = part.substring(colonIndex + 1);

        if (key) {
            result[key] = decodeURIComponent(encodedValue);
        }
    }

    return result;
}

/**
 * Column configuration for cursor pagination by sort type.
 * Maps sort types to their cursor columns (in order of importance).
 * Always includes 'id' as the final tie-breaker for deterministic ordering.
 */
export const cursorColumnsBySortType: Record<
    string,
    { columns: string[]; ascending: boolean }
> = {
    aToZ: { columns: ["title", "id"], ascending: true },
    zToA: { columns: ["title", "id"], ascending: false },
    addedOrder: { columns: ["createdAt", "id"], ascending: false },
    dateAddedAscending: {
        columns: ["fileModifiedAt", "title", "id"],
        ascending: true,
    },
    dateAddedDescending: {
        columns: ["fileModifiedAt", "title", "id"],
        ascending: false,
    },
    releasedYearAscending: {
        columns: ["year", "title", "id"],
        ascending: true,
    },
    releasedYearDescending: {
        columns: ["year", "title", "id"],
        ascending: false,
    },
    trackNoAscending: {
        columns: ["trackNumber", "title", "id"],
        ascending: true,
    },
    trackNoDescending: {
        columns: ["trackNumber", "title", "id"],
        ascending: false,
    },
};
