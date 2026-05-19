let reloadScrollHandled = false;

export function consumeDocumentReloadOnce() {
    if (reloadScrollHandled) return false;
    if (typeof window === "undefined" || !window.performance) return false;

    const entry = window.performance.getEntriesByType?.("navigation")?.[0];
    const nav = window.performance.navigation;
    const legacyReload =
        nav != null && (nav.type === nav.TYPE_RELOAD || nav.type === 1);
    const isReload =
        (entry != null && entry.type === "reload") || legacyReload;

    if (!isReload) return false;
    reloadScrollHandled = true;
    return true;
}

export const MAIN_ITEMS_SCROLL_PREFIX = "main_items_scroll:";

export function clearMainItemsScrollSession() {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(MAIN_ITEMS_SCROLL_PREFIX)) {
            sessionStorage.removeItem(k);
        }
    }
}
