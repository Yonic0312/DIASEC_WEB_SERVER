// 마이페이지 사이드바 / 모바일 공통 메뉴 (경로, 라벨 단일 관리)
export const Member_Nav_Sections = [
    {
        title: '주문 관리',
        items: [
            { label: '주문내역 조회', path: '/orderList' },
            { label: '보정내역 조회', path: '/mypage/retouch' },
            { label: '관심상품 조회', path: '/wishList' },
            { label: '적립금 내역', path: '/creditHistory' },
        ],
    },
    {
        title: '활동 내역',
        items: [
            { label: '리뷰 작성', path: '/reviewWrite' },
            {
                label: '문의하기',
                path: '/supportInquiryForm',
                state: { returnTo: '/myInquiryList' },
            },
            { label: '문의 내역', path: '/myInquiryList' },
        ],
    },
    {
        title: '정보 관리',
        items: [
            { label: '회원정보 수정', path: '/modify' },
            { label: '비밀번호 변경', path: '/changePwd', onlyWeb: true },
            { label: '배송주소 관리', path: '/addrList' },
        ],
    },
];