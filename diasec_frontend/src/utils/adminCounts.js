export const ADMIN_COUNTS_REFRESH = 'admin-counts-refresh';

export function refreshAdminCounts() {
    window.dispatchEvent(new Event(ADMIN_COUNTS_REFRESH));
}