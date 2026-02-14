import { isDatabaseConnected } from '../config/db.js'

/**
 * Guard that returns 503 when MongoDB is unavailable.
 * Usage: `if (!ensureDb(res)) return`
 */
export function ensureDb(res) {
    if (isDatabaseConnected()) return true
    res.status(503).json({ error: 'Database unavailable.' })
    return false
}

/**
 * Parse `page` and `pageSize` from Express query params with sensible defaults.
 */
export function parsePagination(query, fallbackPageSize = 10, maxPageSize = 100) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize) || fallbackPageSize))
    return { page, pageSize, skip: (page - 1) * pageSize }
}

/**
 * Escape and quote a single CSV cell value.
 */
export function quoteCsv(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`
}

/**
 * Convert an array of objects into a CSV string.
 */
export function toCsv(headers, rows) {
    return [
        headers.join(','),
        ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
    ].join('\n')
}
