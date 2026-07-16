import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';
import { PARTNER_TIERS } from '../../config/partnerTiers';

const Biz_PartnerMain = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [partnerStatus, setPartnerStatus] = useState(null);

    useEffect(() => {
        if (!member?.id) {
            setPartnerStatus('');
            return;
        }

        setPartnerStatus(null);
        axios
            .get(`${API}/biz-partner/my-status`, { withCredentials: true })
            .then((res) => setPartnerStatus(res.data?.partnerStatus ?? '없음'))
            .catch(() => setPartnerStatus('없음'));
    }, [API, member?.id]);

    // 비로그인: 신청 버튼 노출(클릭 시 로그인) / 로그인 : 상태 조회 후 승인, 대기면 숨김
    const showApplyButton =
        !member?.id 
            ? true
            : partnerStatus != null &&
              partnerStatus !== '승인' &&
              partnerStatus !== '대기'

    return (
        <div className="w-full px-4 mt-20 mb-16 break-keep">
            <div className="max-w-4xl mx-auto space-y-10">
                <h1 className="md:text-3xl text-[clamp(18px,3.91vw,30px)] text-center font-bold">
                    업무제휴
                </h1>

                {/* 프로세스 */}
                <div className="text-center text-sm md:text-base text-gray-700">
                    신청접수 → 신청내용 검토 (관리자) → 등급 적용
                </div>

                {/* 소개 */}
                <section className="space-y-3 text-gray-800">
                    <h2 className="text-xl font-bold">프리미엄 디아섹 액자를 공급받으세요</h2>
                    <p>
                        고정거래처 등록 시, 19년 제조 노하우를 바탕으로 맞춤 제작부터 전국 배송·설치까지
                        원스톱으로 지원해 드립니다.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold">이런 파트너를 찾습니다</h2>
                    <p className="text-gary-700">
                        웨딩 스튜디오, 인테리어 및 모델하우스, 전시·갤러리 기획사, 프렌차이즈 본사, 콘텐츠 제작자 등 <br/>
                        장기적인 협업이 가능한 전문 파트너를 찾고 있습니다.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-bold">파트너십 혜택</h2>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        <li>파트너 전용 공급가 : 일반 고객과는 차별화된 B2B 전용 단가 제공</li>
                        <li>공동 마케팅 : 디아섹코리아 SNS 및 홈페이지를 통한 파트너사 홍보 지원</li>
                        <li>우선제작 시스템 : 파트너사 주문건에 대한 우선 제작 및 빠른 배송 운영시스템 적용</li>
                    </ul>
                </section>

                {/* 등급표 */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold">파트너 등급 및 할인 기준</h2>
                    <p className="text-sm text-gray-600">
                        거래 실적에 따라 파트너 등급이 자동 조정되며, 등급에 따라 할인 혜택이 차등 적용됩니다.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full max-w-[490px] border-collapse border text-center text-sm">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border p-2">등급</th>
                                    <th className="border p-2">자격 조건</th>
                                    <th className="border p-2">할인율</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PARTNER_TIERS.map((t) => (
                                    <tr key={t.grade}>
                                        <td className="border p-2">{t.grade}</td>
                                        <td className="border p-2">{t.condition}</td>
                                        <td className="border p-2">{t.discount}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            ※ 파트너 할인은 홈페이지 기본 할인에 <strong className="text-gray-600">등급별 추가 할인</strong>이
                            합산되어 주문 시 자동 적용됩니다.
                        </p>
                        <p>
                            ※ 파트너 등급·누적 거래금액은 <strong className="text-gray-600">결제 완료된 주문</strong> 기준으로
                            실시간 반영되며, 승인 완료 후부터 파트너 할인이 적용됩니다.
                        </p>
                        <p>
                            ※ 누적 거래금액 산정 시 배송비, 설치비, 부가세, 별도 외주 비용은 포함되지 않습니다.
                        </p>
                        <p>
                            ※ 본 제휴는 선결제 방식이며, 월말 정산·후불 거래는 제공하지 않습니다.
                        </p>
                        <p>
                            ※ 거래 실적, 결제 이력, 주문 규모, 협업 지속성 등에 따라 등급이 조정될 수 있습니다.
                        </p>
                        <p>
                            ※ 현재 등급·누적 실적·적용 할인율은 로그인 후 <strong className="text-gray-600">마이페이지 &gt; 업무제휴 현황</strong>에서
                            확인하실 수 있습니다.
                        </p>
                    </div>
                </section>

                <div className="flex flex-col items-center gap-3 pt-4">
                    {member?.id && partnerStatus === '대기' && (
                        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center max-w-lg">
                            제휴 신청이 검토 중입니다. 검토 후 승인 여부를 안내드립니다.
                        </p>
                    )}
                    {showApplyButton && (
                        <button
                            type="button"
                            onClick={() => navigate('/bizPartnerApply')}
                            className="bg-black text-white px-6 py-3 rounded font-medium"
                        >
                            업무 제휴 신청하기
                        </button>
                    )}
                    {member?.id && (
                        <button
                            type="button"
                            onClick={() => navigate('/mypage/partner')}
                            className="border border-black px-6 py-3 rounded font-medium"
                        >
                            내 파트너 현황
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Biz_PartnerMain;