// src/pages/policy/Terms.jsx (경로는 네 프로젝트에 맞게)
// 라우팅: /terms

const COMPANY_NAME = "디아섹코리아";
const MALL_NAME = "디아섹코리아 쇼핑몰";

const Terms = () => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-2xl font-bold mb-6">이용약관</h1>

      {/* 상단 핵심 안내(요청사항 3개 + 추가 문장) */}
      <div className="rounded-xl border bg-white p-6 mb-10 text-gray-700 leading-relaxed">
        <h2 className="font-semibold text-gray-900 mb-3">핵심 안내</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            {COMPANY_NAME}의 모든 작품은 <b>주문자 확인 및 동의 후 개별 제작</b>되는{" "}
            <b>1:1 주문제작</b> 상품입니다.
          </li>
          <li>
            <b>제작(생산) 시작 전</b>에는 주문 취소가 가능합니다. (제작이 시작된 이후에는
            상품 특성상 취소/반품/교환이 제한될 수 있습니다.)
          </li>
          <li>
            <b>작품 불량</b>으로 인한 교환/반품의 경우 <b>배송비는 무료</b>입니다.
          </li>
          <li>
            상품의 포장 또는 상품 자체가 <b>훼손</b>된 경우에는 <b>반품 및 교환이 불가</b>합니다.
          </li>
          <li>
            본 쇼핑몰은 <b>비회원 주문</b>이 가능합니다.
          </li>
        </ol>
      </div>

      {/* 본문 */}
      <div className="rounded-xl border bg-white p-6 md:p-8 text-gray-700 leading-relaxed space-y-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            인터넷 쇼핑몰 『{COMPANY_NAME} 사이버 몰』 이용약관
          </h2>

          <div className="space-y-4">
            <section>
              <h3 className="font-semibold text-gray-900">제1조(목적)</h3>
              <p>
                이 약관은 {COMPANY_NAME}(전자상거래 사업자)가 운영하는 {MALL_NAME}(이하 “몰”이라
                한다)에서 제공하는 인터넷 관련 서비스(이하 “서비스”라 한다)를 이용함에 있어
                몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ※ 「PC통신, 무선 등을 이용하는 전자상거래에 대해서도 그 성질에 반하지 않는 한
                이 약관을 준용합니다.」
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제2조(정의)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  “몰”이란 {COMPANY_NAME}가 재화 또는 용역(이하 “재화 등”)을 이용자에게 제공하기
                  위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한
                  가상의 영업장을 말하며, 아울러 사이버몰을 운영하는 사업자의 의미로도 사용합니다.
                </li>
                <li>“이용자”란 “몰”에 접속하여 이 약관에 따라 “몰”이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li>‘회원’이라 함은 “몰”에 회원등록을 한 자로서, 계속적으로 “몰”이 제공하는 서비스를 이용할 수 있는 자를 말합니다.</li>
                <li>‘비회원’이라 함은 회원에 가입하지 않고 “몰”이 제공하는 서비스를 이용하는 자를 말합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제3조(약관 등의 명시와 설명 및 개정)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  “몰”은 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소(소비자의 불만을 처리할 수 있는 곳의 주소 포함),
                  전화번호·모사전송번호·전자우편주소, 사업자등록번호, 통신판매업 신고번호, 개인정보보호책임자 등을
                  이용자가 쉽게 알 수 있도록 초기 서비스화면(전면)에 게시합니다. 다만 약관의 내용은 연결화면을 통하여 볼 수 있도록 할 수 있습니다.
                </li>
                <li>
                  “몰”은 이용자가 약관에 동의하기에 앞서 청약철회·배송책임·환불조건 등 중요한 내용을 이용자가 이해할 수 있도록
                  별도의 연결화면 또는 팝업화면 등을 제공하여 이용자의 확인을 구하여야 합니다.
                </li>
                <li>
                  “몰”은 관련 법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
                </li>
                <li>
                  “몰”이 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행약관과 함께 초기화면에 공지합니다.
                  이용자에게 불리한 변경의 경우 최소 30일 이상의 사전 유예기간을 둡니다.
                </li>
                <li>
                  개정약관은 적용일자 이후 체결되는 계약에만 적용되고, 그 이전 계약에는 개정 전 약관이 적용됩니다.
                  다만 이용자가 공지기간 내 적용을 원하고 “몰”이 동의한 경우에는 개정약관이 적용됩니다.
                </li>
                <li>
                  이 약관에서 정하지 아니한 사항과 해석은 관련 법령 및 상관례에 따릅니다.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제4조(서비스의 제공 및 변경)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  “몰”은 다음 업무를 수행합니다.
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>재화 또는 용역에 대한 정보 제공 및 구매계약의 체결</li>
                    <li>구매계약이 체결된 재화 또는 용역의 배송</li>
                    <li>기타 “몰”이 정하는 업무</li>
                  </ol>
                </li>
                <li>품절 또는 기술적 사양 변경 등의 경우 제공 내용을 변경할 수 있으며, 변경 내용 및 제공일자를 공지합니다.</li>
                <li>서비스 내용 변경 시 이용자에게 통지 가능한 주소로 즉시 통지합니다.</li>
                <li>이로 인해 이용자에게 손해가 발생한 경우 배상합니다(고의·과실 없음 입증 시 제외).</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제5조(서비스의 중단)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>설비 보수점검·교체·고장, 통신 두절 등 사유가 발생한 경우 서비스 제공을 일시 중단할 수 있습니다.</li>
                <li>중단으로 인한 손해를 배상합니다(고의·과실 없음 입증 시 제외).</li>
                <li>사업 전환/포기/통합 등으로 서비스 제공이 불가한 경우 이용자에게 통지하고 조건에 따라 보상합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제6조(회원가입)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>이용자는 “몰”이 정한 가입 양식에 따라 회원정보를 기입하고 약관 동의 의사표시로 회원가입을 신청합니다.</li>
                <li>“몰”은 허위 기재, 오기, 기술상 지장 등 사유가 없는 한 회원으로 등록합니다.</li>
                <li>회원가입계약 성립 시기는 “몰”의 승낙이 회원에게 도달한 시점으로 합니다.</li>
                <li>회원은 등록 사항 변경 시 지체 없이 수정 등 방법으로 알려야 합니다.</li>
              </ol>
              <p className="mt-3 text-sm text-gray-600">
                ※ 비회원은 회원가입 없이도 상품 구매(비회원 주문)가 가능합니다.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제7조(회원 탈퇴 및 자격 상실 등)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>회원은 언제든지 탈퇴를 요청할 수 있으며 “몰”은 즉시 처리합니다.</li>
                <li>허위등록, 대금 미지급, 질서 위협, 금지행위 등 사유가 있는 경우 자격을 제한·정지할 수 있습니다.</li>
                <li>정지 후 반복 또는 시정되지 않는 경우 자격 상실 처리할 수 있습니다.</li>
                <li>자격 상실 시 회원등록 말소 및 소명 기회를 부여합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제8조(회원에 대한 통지)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>회원 통지는 회원이 지정한 이메일 주소로 할 수 있습니다.</li>
                <li>불특정다수 통지는 1주일 이상 게시판 게시로 갈음할 수 있습니다(중요 사항은 개별 통지).</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제9조(구매신청)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  이용자는 “몰”상에서 구매를 신청하며, “몰”은 다음 내용을 알기 쉽게 제공합니다.
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>재화 등의 검색 및 선택</li>
                    <li>받는 사람 정보 입력</li>
                    <li>약관, 청약철회 제한, 배송료 등 확인</li>
                    <li>약관 동의 표시</li>
                    <li>구매신청 확인</li>
                    <li>결제방법 선택</li>
                  </ol>
                </li>
                <li>
                  제3자 제공/위탁이 필요한 경우 실제 구매신청 시 동의를 받으며, 제공 항목/목적/보유기간 등을 명시합니다(관련 법령 예외 제외).
                </li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제10조(계약의 성립)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>구매신청에 대하여 허위 기재 등 사유가 있는 경우 승낙하지 않을 수 있습니다.</li>
                <li>수신확인통지가 이용자에게 도달한 시점에 계약이 성립한 것으로 봅니다.</li>
                <li>승낙 의사표시에는 구매 확인/판매 가능 여부/정정·취소 정보 등을 포함합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제11조(지급방법)</h3>
              <p>재화 또는 용역의 대금지급방법은 가용한 방법으로 할 수 있으며, 수수료를 추가로 징수하지 않습니다.</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>계좌이체(폰뱅킹/인터넷뱅킹 등)</li>
                <li>신용카드/직불카드/선불카드</li>
                <li>온라인무통장입금</li>
                <li>전자화폐 결제</li>
                <li>수령 시 대금지급</li>
                <li>포인트 결제</li>
                <li>상품권 결제</li>
                <li>기타 전자적 지급 방법</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제12조(수신확인통지·구매신청 변경 및 취소)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>“몰”은 이용자의 구매신청이 있는 경우 수신확인통지를 합니다.</li>
                <li>
                  이용자는 수신확인통지 후 즉시 변경/취소를 요청할 수 있고, “몰”은 배송 전에 요청이 있는 경우 지체 없이 처리합니다.
                </li>
              </ol>
              <p className="mt-3 text-sm text-gray-600">
                ※ 주문제작 상품 특성상, <b>제작(생산) 시작 전</b>에는 취소가 가능하나, 제작이 시작된 이후에는 취소/변경이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제13조(재화 등의 공급)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>주문일로부터 7일 이내 배송할 수 있도록 필요한 조치를 합니다(대금 수령 시 3영업일 이내 조치 등).</li>
                <li>배송수단/비용/기간 등을 명시합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제14조(환급)</h3>
              <p>품절 등으로 인도/제공이 불가한 경우 사유를 통지하고 대금을 환급하거나 필요한 조치를 합니다.</p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제15조(청약철회 등)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>관련 법에 따라 서면 수령일(또는 공급일)부터 7일 이내 청약철회가 가능합니다(법령 예외 준용).</li>
                <li>
                  재화 등을 배송 받은 경우 다음에 해당하면 반품/교환이 제한됩니다.
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>이용자 책임으로 멸실/훼손(확인 위한 포장 훼손은 제외)</li>
                    <li>사용/소비로 가치가 감소</li>
                    <li>시간 경과로 재판매 곤란</li>
                    <li>복제 가능한 재화의 포장 훼손</li>
                  </ol>
                </li>
                <li>제한 사실을 사전에 명기하지 않은 경우 이용자의 청약철회가 제한되지 않습니다.</li>
                <li>표시·광고/계약과 다르게 이행된 경우 관련 기간 내 청약철회 가능합니다.</li>
              </ol>

              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">추가 안내(주문제작/불량/훼손)</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>주문제작 상품은 제작 시작 후 취소/변경/반품이 제한될 수 있습니다.</li>
                  <li>작품 불량으로 인한 교환/반품 배송비는 “몰”이 부담합니다.</li>
                  <li>상품 포장 또는 상품 자체가 훼손된 경우 반품/교환이 불가합니다.</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제16조(청약철회 등의 효과)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>반환받은 경우 3영업일 이내 환급합니다.</li>
                <li>카드/전자화폐 결제 시 결제 취소 요청 등 조치를 합니다.</li>
                <li>반환 비용은 이용자 부담(표시·광고 또는 계약과 다르게 이행된 경우 “몰” 부담).</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제17조(개인정보보호)</h3>
              <p>
                “몰”은 관련 법령 및 개인정보처리방침에 따라 개인정보를 보호하며, 개인정보 수집·이용·제공 시 고지 및 동의를 받습니다.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제18조(“몰”의 의무)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>법령과 약관을 준수하며 안정적으로 서비스를 제공합니다.</li>
                <li>개인정보 보호를 위한 보안 시스템을 갖춥니다.</li>
                <li>부당 표시·광고로 손해 발생 시 배상합니다.</li>
                <li>원하지 않는 광고성 이메일을 발송하지 않습니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제19조(회원의 ID 및 비밀번호에 대한 의무)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>ID/비밀번호 관리책임은 회원에게 있습니다.</li>
                <li>제3자 이용을 허용할 수 없습니다.</li>
                <li>도난/무단 사용 인지 시 즉시 “몰”에 통보해야 합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제20조(이용자의 의무)</h3>
              <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>허위 내용 등록</li>
                <li>타인 정보 도용</li>
                <li>게시 정보 변경</li>
                <li>“몰”이 정한 정보 이외 송신/게시</li>
                <li>저작권 등 지적재산권 침해</li>
                <li>명예 훼손/업무 방해</li>
                <li>공서양속에 반하는 정보 게시</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제21조(연결 “몰”과 피연결 “몰” 간의 관계)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>하이퍼링크 등으로 연결된 경우 전자를 연결 “몰”, 후자를 피연결 “몰”이라 합니다.</li>
                <li>피연결 “몰”의 독자적 거래에 대해 보증 책임을 지지 않을 수 있습니다(명시한 경우).</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제22조(저작권의 귀속 및 이용제한)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>“몰”의 저작권 등 지적재산권은 “몰”에 귀속합니다.</li>
                <li>사전 승낙 없이 영리 목적 이용/제3자 이용을 금지합니다.</li>
                <li>약정에 따라 이용자에게 귀속된 저작권 사용 시 통보합니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제23조(분쟁해결)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>피해보상처리기구를 설치·운영합니다.</li>
                <li>불만사항은 우선 처리하며, 지연 시 사유 및 일정 통보합니다.</li>
                <li>분쟁조정기관의 조정에 따를 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">제24조(재판권 및 준거법)</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>전자상거래 분쟁 소송은 민사소송법상 관할법원에 제기합니다.</li>
                <li>준거법은 한국법을 적용합니다.</li>
              </ol>
            </section>

            <div className="pt-6 border-t text-sm text-gray-600">
              <p>본 약관은 2026년 02월 20일부터 적용됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;