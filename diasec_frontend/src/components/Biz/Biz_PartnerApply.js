import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MemberContext } from '../../context/MemberContext';
import { CONTRACT_TEXT, INDUSTRY_OPTIONS } from '../../config/partnerTiers';

const Biz_PartnerApply = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);

    const [form, setForm] = useState({
        companyName: '',
        managerNameTitle: '',
        phone1: '010', phone2: '', phone3: '',
        email: '',
        industry: '',
        etcRequest: '',
        contractAgreed: false,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!member?.id) {
            toast.info('로그인 후 신청 가능합니다.');
            navigate('/userLogin', { state: { returnTo: '/bizPartner' } });
            return;
        }
        
        if (member.email) setForm((f) => ({ ...f, email: member.email }));
        if (member.phone) {
            const parts = member.phone.split('-');
            if (parts.length === 3) {
                setForm((f) => ({ ...f, phone1: parts[0], phone2: parts[1], phone3: parts[2] }));
            }
        }
    }, [member, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const phone = [form.phone1, form.phone2, form.phone3].filter(Boolean).join('-');
        if (!form.companyName) { toast.error('업체명을 입력해주세요.'); return; }
        if (!form.managerNameTitle) { toast.error('담당자명/직책을 입력해주세요.'); return; }
        if (!phone || phone.length < 10) { toast.error('연락처를 입력해주세요.'); return; }
        if (!form.email) { toast.error('이메일을 입력해주세요.'); return; }
        if (!form.industry) { toast.error('업종을 선택해주세요.'); return; }
        if (!form.contractAgreed) { toast.error('제휴 계약서에 동의해주세요.'); return; }

        setSubmitting(true);
        try {
            await axios.post(`${API}/biz-partner/apply`, {
                companyName: form.companyName,
                managerNameTitle: form.managerNameTitle,
                phone,
                email: form.email,
                industry: form.industry,
                etcRequest: form.etcRequest,
                contractAgreed: true,
            }, { withCredentials: true });

            alert(
                '신청접수되었습니다.\n' +
                '검토 후 마이페이지 > 업무제휴 현황에서 결과를 확인하실 수 있습니다.'
            );
            navigate('/mypage/partner');
        } catch (err) {
            const msg = err.response?.data || '신청 중 오류가 발생했습니다.';
            toast.error(typeof msg === 'string' ? msg : '신청 중 오류가 발생했습니다.');
        } finally { 
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full px-4 mt-20 mb-16">
            <div className="max-w-3xl mx-auto">
                <h2 className="md:text-3xl text-center font-bold mb-8">업무 제휴 신청서</h2>

                <form onSubmit={handleSubmit} className="border p-4 rounded-md space-y-5">
                    <div>
                        <label className="block text-sm mb-1">업체명 <span className="text-red-500">*</span></label>
                        <input name="companyName" value={form.companyName} onChange={handleChange} 
                            className="w-full border p-2 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">담당자명 / 직책 <span className="text-red-500">*</span></label> 
                        <input name="managerNameTitle" value={form.managerNameTitle} onChange={handleChange}
                            placeholder="홍길동 / 대표" className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">연락처 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input name="phone1" value={form.phone1} onChange={handleChange} className="w-20 border p-2 rounded" />
                            <input name="phone2" value={form.phone2} onChange={handleChange} className="flex-1 border p-2 rounded" />
                            <input name="phone3" value={form.phone3} onChange={handleChange} className="flex-1 border p-2 rounded" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">이메일 <span className="text-red-500">*</span></label> 
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            placeholder="공식 제안서·견적서 회신용" className="w-full border p-2 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">업종 <span className="text-red-500">*</span></label>
                        <select name="industry" value={form.industry} onChange={handleChange}
                            className="w-full border p-2 rounded">
                            <option value ="">선택하세요</option>
                            {INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">기타 요청사항</label>
                        <textarea name="etcRequest" value={form.etcRequest} onChange={handleChange}
                            rows={4} className="w-full border p-2 rounded" />
                    </div>

                    {/* 계약서 미리보기 */}
                    <div className="border rounded p-4 bg-gray-50">
                        <p className="font-medium mb-2">계약서 미리보기</p>
                        <pre className="text-xs whitespace-pre-line text-gray-700 max-h-48 overflow-y-auto">
                            {CONTRACT_TEXT}
                        </pre>
                        <label className="flex items-start gap-2 mt-3 text-sm cursor-pointer">
                            <input type="checkbox" name="contractAgreed"
                                checked={form.contractAgreed} onChange={handleChange} />
                            <span>제휴 계약서 내용을 확인하였으며, 이에 동의합니다. (필수)</span>
                        </label>
                    </div>

                    <div className="flex justify-center gap-3">
                        <button type="button" onClick={() => navigate('/bizPartner')}
                            className="border px-6 py-2 rounded">취소</button>
                        <button type="submit" disabled={submitting}
                            className="bg-black text-white px-6 py-2 rounded disabled:opacity-50">
                            {submitting ? '접수 중...' : '신청접수'}        
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Biz_PartnerApply;