/**
 * 택배 배송조회 외부 링크
 * - 한진: WaybillResult.do + wblnum (숫자만) — 사이트 정책 변경 시 동작이 달라질 수 있음
 * - CJ대한통운: tracking.html?wblNo= + 운송장 숫자 (하이픈 제거)
 * @see https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038
 * @see https://trace.cjlogistics.com/next/tracking.html?wblNo=
 */

export const HANJIN_WAYBILL_SEARCH_URL =
    'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038';

/** 한진이 아닐 때(통합 검색 등) */
export const NON_HANJIN_TRACKING_FALLBACK_URL =
    'https://search.naver.com/search.naver?where=nv&sm=top_sug.pre&fbm=0&acr=2&acq=%ED%83%9D%EB%B0%B0+%EC%A1%B0%ED%9A%8C&qdt=0&ie=utf8&query=%ED%83%9D%EB%B0%B0+%EC%A1%B0%ED%9A%8C&ackey=u9uianhk';

/**
 * @param {string | null | undefined} trackingNumber
 * @returns {string}
 */
export function buildHanjinTrackingUrl(trackingNumber) {
    const digits = String(trackingNumber ?? '').replace(/\D/g, '');
    if (!digits) {
        return HANJIN_WAYBILL_SEARCH_URL;
    }
    return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnum=${encodeURIComponent(digits)}`;
}

export const CJ_TRACKING_URL_BASE = 
    'https://trace.cjlogistics.com/next/tracking.html?wblNo=';
/**
 * 저장된 운송장에서 하이픈을 빼고 CJ 배송조회로 연결한다.
 * @param {string | null | undefined} trackingNumber
 * @returns {string}
 */
export function buildCjTrackingUrl(trackingNumber) {
    const digits = String(trackingNumber ?? '').replace(/-/g, '').trim();
    if (!digits) {
        return CJ_TRACKING_URL_BASE;
    }
    return `${CJ_TRACKING_URL_BASE}${encodeURIComponent(digits)}`;
}


/**
 * @param {string | null | undefined} company
 * @param {string | null | undefined} trackingNumber
 */
export function resolveTrackingLookupUrl(company, trackingNumber) {
    const c = String(company ?? '').replace(/\s+/g, '');
    if (c === '한진택배') {
        return buildHanjinTrackingUrl(trackingNumber);
    }
    if (c === 'CJ대한통운') {
        return buildCjTrackingUrl(trackingNumber);
    }
    return NON_HANJIN_TRACKING_FALLBACK_URL;
}
