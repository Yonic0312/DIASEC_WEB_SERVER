const DeliveryReturn = () => {
    return (
        <div className="
            flex flex-col space-y-10 text-gray-800 leading-relaxed break-keep
            md:text-[15px] text-[clamp(13px,1.955vw,15px)]">
            <span 
                className="
                    mt-5 ml-1 font-bold
                    md:text-2xl text-[clamp(20px,3.128vw,24px)]">배송 / 환불 안내</span>
            <hr/>
            
            <section className="mx-1">
                <span 
                    className="
                        md:text-xl text-[clamp(18px,2.607vw,20px)] 
                        font-semibold">
                    결제 안내
                </span>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>고액결제의 경우 카드사 확인 절차가 있을 수 있습니다. 도난 카드나 타인 명의의 결제 등 이상 거래로 판단될 경우, 주문은 임의로 보류 또는 취소될 수 있습니다.</li>
                    <li>무통장 입금 시 주문자명과 입금자명을 동일하게 부탁드리며, 7일 이내 미입금 시 주문은 자동 취소됩니다.</li>
                    <li>결제 완료 후 시안 작업 및 맞춤 제작이 진행되며, 제작 완료 후 배송이 시작됩니다.</li>
                </ul>
            </section>

            <hr/>

            <section className="mx-1">
                <span 
                    className="
                        md:text-xl text-[clamp(18px,2.607vw,20px)]
                        font-semibold">배송 안내</span>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>배송방법:</strong> 택배 또는 방문수령</li>
                    <li><strong>배송지역:</strong> 전국 (제주/도서산간 지역은 추가 요금 발생 가능)</li>
                    {/* <li><strong>배송비용:</strong> 조건별 상이 (주문 시 안내)</li> */}
                    <li><strong>배송비용:</strong> <span className="text-green-600">무료배송</span></li>
                    <li><strong>배송기간:</strong> 약 2일 ~ 7일 소요</li>
                    <li>상품 종류 및 제작 상황에 따라 배송 일정이 다소 지연될 수 있습니다.</li>
                </ul>
            </section>

            <hr/>

            <section className="mx-1">
                <span 
                    className="
                        md:text-xl text-[clamp(18px,2.607vw,20px)] 
                        font-semibold">교환 및 반품 주소</span>
                <address className="not-italic text-gray-700 mt-2">
                    경기도 고양시 덕양구 통일로 140 삼송 테크노벨리 A동 355호 (10594) 디투원
                </address>
            </section>

            <hr/>

            <section className="mx-1">
                <span 
                    className="
                        md:text-xl text-[clamp(18px,2.607vw,20px)] 
                        font-semibold">교환 및 반품이 가능한 경우</span>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>배송된 상품이 주문 내용과 다르거나(예: 사이즈, 색상) 파손되었을 경우</li>
                        <span className="text-red-500 font-semibold">
                            반드시 겉비닐을 제거하지 않은 상태에서 제품 전체가 보이도록 사진을 촬영해 주셔야 하며,
                            개봉 또는 훼손 후에는 교환 및 환불이 불가합니다.
                        </span>
                        <li>상품에 문제가 있는 경우 확인 절차 후 재제작 또는 환불 처리를 진행해드립니다.</li>
                    </ul>
            </section>

            <hr/>

            <div className="mx-1">
                <span 
                    className="
                        md:text-xl text-[clamp(18px,2.607vw,20px)] 
                        font-semibold">교환 및 반품이 불가능한 경우</span>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>단순 변심에 의한 교환/환불 요청 (맞춤 제작 상품 특성상 불가)</li>
                        <li>고객의 부주의로 상품이 훼손 또는 파손된 경우</li>
                        <li>상품 수령 후 시간이 경과하여 재판매가 어려운 경우</li>
                        <li>포장이 훼손되거나 사용 흔적이 있는 경우</li>
                        <li>디지털 콘텐츠 등 복제가 가능한 상품의 제공이 시작된 경우</li>
                    </ul>
            </div>
            <span className="md:text-base text-[clamp(14px,2.085vw,16px)] text-gray-600 mt-2 ml-1">※ 맞춤 제작 액자 상품의 경우, 제작이 시작된 이후에는 단순 변심으로 인한 교환 및 환불이 불가하오니 신중한 구매 부탁드립니다.</span>
        </div>
    )
}

export default DeliveryReturn;