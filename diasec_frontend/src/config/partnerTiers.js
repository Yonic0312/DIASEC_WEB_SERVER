export const PARTNER_TIERS = [
    { grade: '신규 파트너', condition: '가입 시 적용', discount: 5, minAmount: 0 },
    { grade: '실버 파트너', condition: '누적 1천만원 이상', discount: 10, minAmount: 10_000_000 },
    { grade: '골드 파트너', condition: '누적 5천만원 이상', discount: 15, minAmount: 50_000_000 },
    { grade: '플래티넘 파트너', condition: '누적 1억원 이상', discount: 20, minAmount: 100_000_000 },
    { grade: '다이아 파트너', condition: '누적 3억원 이상', discount: 25, minAmount: 300_000_000 },
    { grade: '블랙 파트너', condition: '누적 5억원 이상', discount: 30, minAmount: 500_000_000 },
];

export const CONTRACT_TEXT = `제1조 (거래 방식)
본 계약에 따른 거래는 원칙적으로 선결제를 기준으로 한다.

제2조 (납기 기준)
1. 제작 기간은 발주 확정 및 결제 완료 후 o엽업일을 기준으로 한다.
2. 긴급 제작은 사전 협의 후 진행한다.
불가항력적 사유 발생 시 즉시 통보한다.

제3조 (정산 조건)
1. 기한 내 미지급 시 추가 제작은 자동 보류된다.
2. 30일 이상 연체 시 계약 해지 사유가 될 수 있다.

제4조 (소유권)
제품의 소유권은 대금 완납 시점에 이전된다.

제5조 (거래 한도)
상호 합의된 월 거래 한도를 초과할 경우, 추가 제작은 정산 완료 후 진행된다.

제6조 (품질 기준)
출력물 색상 차이는 모니터 환경 및 인쇄 특성에 따른 차이로, 제작 하자로 간주하지 않는다.`;

export const INDUSTRY_OPTIONS = [
    '인테리어', '웨딩', '전시', '갤러리', '프랜차이즈', '콘텐츠', '기타'
];