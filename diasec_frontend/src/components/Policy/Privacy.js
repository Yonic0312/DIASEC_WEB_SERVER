const Privacy = () => {
  const COMPANY_NAME = "디아섹코리아"; // 여기만 바꿔도 본문 반영되게

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>

      {/* 카드 박스 */}
      <div className="rounded-xl border bg-white p-8 md:p-10 leading-relaxed text-gray-800">
        {/* 상단 안내 */}
        <p className="mb-6 text-gray-700">
          {COMPANY_NAME}(이하 “회사”)는 고객님의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
          회사는 본 개인정보처리방침을 통해 고객님께서 제공하시는 개인정보가 어떠한 용도와 방식으로 이용되는지,
          개인정보보호를 위해 어떠한 조치가 취해지고 있는지 안내드립니다.
        </p>

        <div className="space-y-10">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold mb-3">1. 수집하는 개인정보 항목 및 수집방법</h2>

            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold mb-2">가. 수집하는 개인정보의 항목</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>회원가입 시: 이름, 로그인ID, 비밀번호, 휴대전화번호, 이메일</li>
                  <li>주문/배송 시: 수령인 정보(이름/연락처), 배송지 주소</li>
                  <li>결제 시: 결제수단 정보(결제대행사를 통해 처리 과정에서 생성되는 결제정보)</li>
                  <li>
                    서비스 이용 과정에서 자동 생성/수집될 수 있는 항목: 서비스이용기록, 접속로그, 쿠키, 접속 IP, 결제 기록, 불량이용 기록
                  </li>
                </ul>

                {/* <p className="mt-3 text-sm text-gray-500">
                  ※ 실제 회원가입 폼/주문 폼에서 받는 항목에 맞게 위 리스트를 너 사이트 기준으로 맞춰야 함.
                </p> */}
              </div>

              <div>
                <p className="font-semibold mb-2">나. 수집방법</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>홈페이지(회원가입/주문/문의), 서면양식, 게시판, 이메일, 배송요청, 전화</li>
                  <li>생성정보 수집 툴을 통한 수집(접속로그, 쿠키 등)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold mb-3">2. 개인정보의 수집 및 이용목적</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>서비스 제공 및 계약 이행: 콘텐츠 제공, 구매/결제, 물품배송, 청구지 발송, 본인 확인</li>
              <li>회원 관리: 본인확인, 개인식별, 부정 이용 방지, 가입 의사 확인, 민원처리, 고지사항 전달</li>
              <li>마케팅/광고(선택 동의 시): 이벤트 안내, 혜택 안내, 접속 빈도 분석 및 서비스 이용 통계</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold mb-3">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-gray-700 mb-3">
              원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 아래와 같이 보관할 수 있습니다.
            </p>

            <div className="rounded-lg bg-gray-50 p-4 text-gray-700">
              <ul className="list-disc pl-6 space-y-1">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>로그 기록(접속기록 등): 3개월</li>
              </ul>
            </div>

            {/* <p className="mt-3 text-sm text-gray-500">
              ※ 위 기간/항목은 너가 가져온 원문 기준인데, 실제 운영/PG/쇼핑몰 정책과 맞는지 확인 필요.
            </p> */}
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold mb-3">4. 개인정보의 파기절차 및 방법</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>파기절차: 목적 달성 후 별도 DB로 옮겨 내부 방침 및 법령에 따라 일정 기간 저장 후 파기</li>
              <li>파기방법: 전자적 파일은 복구 불가능한 기술적 방법으로 삭제</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold mb-3">5. 개인정보 제공</h2>
            <p className="text-gray-700">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의하거나,
              법령에 따라 수사기관 요청이 있는 경우 제공될 수 있습니다.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold mb-3">6. 개인정보 처리 위탁</h2>
            <p className="text-gray-700 mb-3">
              회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 외부에 위탁할 수 있습니다.
            </p>

            <div className="rounded-lg bg-gray-50 p-4 text-gray-700 space-y-2">
              <div>
                <p className="font-semibold">- PG사</p>
                <p className="text-sm text-gray-600">위탁업무: 결제 처리</p>
              </div>
              <div>
                <p className="font-semibold">- 택배사</p>
                <p className="text-sm text-gray-600">위탁업무: 상품 배송</p>
              </div>
              <div>
                <p className="font-semibold">- 카페24</p>
                <p className="text-sm text-gray-600">위탁업무: 쇼핑몰 시스템 운영(호스팅/서비스 제공 등)</p>
              </div>
              <div>
                <p className="font-semibold">- SOLAPI</p>
                <p className="text-sm text-gray-600">위탁업무: 알림 메시지 발송</p>
              </div>
            </div>

            {/* <p className="mt-3 text-sm text-gray-500">
              ※ 여기 “PG사 이름/택배사 이름/문자 발송 업체”는 실제 사용하는 업체명으로 꼭 채워야 함.
            </p> */}
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold mb-3">7. 이용자 및 법정대리인의 권리와 행사방법</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>이용자는 언제든지 개인정보 조회/수정/삭제/처리정지/동의철회를 요청할 수 있습니다.</li>
              <li>회원정보 수정 또는 회원탈퇴 기능을 통해 직접 처리할 수 있습니다.</li>
              <li>문의가 필요한 경우 아래 개인정보보호 담당자에게 연락하시면 지체 없이 조치합니다.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold mb-3">8. 쿠키(cookie) 등 자동수집 장치</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>서비스 제공을 위해 쿠키를 사용할 수 있습니다.</li>
              <li>브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold mb-3">9. 개인정보 보호책임자 및 담당부서</h2>

            <div className="rounded-lg border p-4 text-gray-700">
              <p className="font-semibold mb-2">개인정보보호책임자</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {`성명: 조현준
                소속: ${COMPANY_NAME}
                전화번호: 010-8998-3757
                이메일: ad3121@naver.com`}
              </p>
            </div>

            <p className="mt-4 text-gray-700">
              개인정보 침해 신고/상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700 mt-2">
              <li>개인정보침해신고센터: 국번 없이 118</li>
              <li>개인정보분쟁조정위원회: 1833-6972</li>
              <li>대검찰청 사이버수사과: 지역번호 + 1301</li>
              <li>경찰청 사이버안전국: 국번없이 182</li>
            </ul>
          </section>

          {/* 시행일 */}
          <section className="pt-2">
            <p className="text-sm text-gray-500">
              시행일자: 2026-02-20 (운영 시작일에 맞게 수정)
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;