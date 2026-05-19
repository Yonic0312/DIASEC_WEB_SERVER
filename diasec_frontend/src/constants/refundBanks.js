/**
 * [배포·동기화 주의] NicePay 가상계좌 환불 API refundBankCode(3자리)와 동일. 백엔드 NicepayBankCodeResolver와 맞춰야 합니다.
 * 로컬에서만 고치고 서버와 어긋나면 환불 요청이 실패할 수 있습니다.
 */
// DB `bank_name`에는 code를 저장하는 것을 권장 (표시는 labelForRefundBankCode).

export const REFUND_BANK_OPTIONS = [
    { code: '002', label: 'KDB산업은행' },
    { code: '003', label: 'IBK기업은행' },
    { code: '004', label: 'KB국민은행' },
    { code: '007', label: '수협은행' },
    { code: '011', label: 'NH농협은행' },
    { code: '020', label: '우리은행' },
    { code: '023', label: 'SC제일은행' },
    { code: '027', label: '한국씨티은행' },
    { code: '031', label: '대구은행' },
    { code: '032', label: '부산은행' },
    { code: '034', label: '광주은행' },
    { code: '035', label: '제주은행' },
    { code: '037', label: '전북은행' },
    { code: '039', label: '경남은행' },
    { code: '045', label: '새마을금고' },
    { code: '071', label: '우체국' },
    { code: '081', label: '하나은행' },
    { code: '088', label: '신한은행' },
    { code: '089', label: '케이뱅크' },
    { code: '090', label: '카카오뱅크' },
    { code: '092', label: '토스뱅크' },
].sort((a, b) => a.label.localeCompare(b.label));

export function labelForRefundBankCode(codeOrName) {
    if (codeOrName == null || String(codeOrName).trim() === '') return '';
    const s = String(codeOrName).trim();
    const hit = REFUND_BANK_OPTIONS.find((o) => o.code === s);
    if (hit) return `${hit.label} (${s})`;
    return s;
}