import { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';

const phoneSplit = (raw='') => {
    // 숫자만 추출해서 3등분
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length < 7) return { p1: '010', p2: '', p3: '' };
    const p1 = digits.slice(0, 3) || '010';
    const midLen = digits.length === 10 ? 3 : 4; // 10자리면 3-3-4 / 11자리면 3-4-4
    const p2 = digits.slice(3, 3 + midLen);
    const p3 = digits.slice(3 + midLen, 11);
    return { p1, p2, p3 };
};

const AuthorRegisterForm = () => {
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const API = process.env.REACT_APP_API_BASE;

    // 기본정보(마이페이지에 없을 때만 입력받음)
    const initialPhone = useMemo(() => phoneSplit(member?.phone), [member?.phone]);
    const [base, setBase] = useState({
        name: member?.name || '',
        email: member?.email || '',
        p1: initialPhone.p1,
        p2: initialPhone.p2,
        p3: initialPhone.p3,
    });

    // 추가 입력
    const [form, setForm] = useState({
        nickname: '',
        description: '',
        tagline: '',
        portfolio: '',
        accountHolder: '',
        bank: '',
        accountNumber: '',
        title: '',
    });

    const [profileImg, setProfileImg] = useState(null);
    const [agree, setAgree] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const hasName = !!member?.name;
    const hasEmail = !!member?.email;
    const hasPhone = !!member?.phone;

    const handleBaseChange = (e) => {
        const {name, value} = e.target;
        setBase((p) => ({ ...p, [name]: value}));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
    };
    const handleFileChange = (e) => setProfileImg(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agree) return alert('정산/약관 동의를 체크해주세요.');
        if (!form.nickname.trim()) return alert('작가명을 입력해주세요.');
        if (!profileImg) return alert('대표 이미지를 업로드해주세요.');

        // 기본정보가 없는 경우에는 필수로 받기
        if (!hasName && !base.name.trim()) return alert('이름을 입력해주세요.');
        if (!hasEmail && !base.email.trim()) return alert('이메일을 입력해주세요.');
        if (!hasPhone && (!base.p1 || !base.p2 || !base.p3)) return alert('연락처를 모두 입력해주세요.');

        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('profileImg', profileImg);

        if (member?.id) fd.append('memberId', member.id);
        if (!hasName) fd.append('name', base.name.trim());
        if (!hasEmail) fd.append('email', base.email.trim());
        if (!hasPhone) fd.append('phone', `${base.p1}-${base.p2}-${base.p3}`);

        try {
            setSubmitting(true);
            const res = await fetch(`${API}/author/register`, {
                method: 'POST',
                body:fd,
                credentials: 'include',
            });
            const result = await res.json();
            if (result.success) {
                alert('작가 등록 신청이 완료되었습니다.');
                navigate('/');
            } else {
                alert('등록 실패: ' + (result.message || '알 수 없는 오류'));
            }
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <>
                <h2 
                    className="
                        md:text-3xl text-[clamp(16px,3.91vw,30px)]
                        font-bold mb-8 text-center">
                            작가 등록 신청
                </h2>

                {/* 기본 정보: 있으면 읽기전용, 없으면 입력 */}
                <div className="mb-8 rounded-xl border bg-gray-50">
                    <div 
                        className="
                            md:text-base text-[clamp(12px,2.085vw,16px)]
                            px-6 py-4 border-b font-semibold">기본 정보</div>
                    <div 
                        className="
                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                            grid grid-cols-2 gap-4 p-6">
                        <div className="flex flex-col">
                            <label className="text-gray-600 mb-1">이름</label>
                            {hasName ? (
                                <div className="rounded border bg-white px-3 py-2">{member.name}</div>    
                            ) : (
                                <input 
                                    type="text"
                                    name="name"
                                    value={base.name}
                                    onChange={handleBaseChange}
                                    className="rounded border bg-white px-3 py-2"
                                    placeholder="이름을 입력하세요"
                                />
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-gray-600 mb-1">이메일</span>
                            {hasEmail ? (
                                <div className="rounded border bg-white px-3 py-2">{member.email || '-'}</div>
                            ) : (
                                <input 
                                    type="email"
                                    name="email"
                                    value={base.email}
                                    onChange={handleBaseChange}
                                    className="rounded border bg-white px-3 py-2"
                                    placeholder="example@domain.com"
                                />
                            )}
                        </div>

                        <div className="flex flex-col col-span-2">
                            <span className="text-gray-600 mb-1">연락처</span>
                            {hasPhone ? (
                                <div className="rounded border bg-white px-3 py-2">{member.phone}</div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select
                                        name="p1"
                                        value={base.p1}
                                        onChange={handleBaseChange}
                                        className="w-[90px] rounded border px-2 py-2"
                                    >
                                        {['010', '011', '016', '017', '018', '019'].map((p) => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <span>-</span>
                                    <input
                                        type="text"
                                        name="p2"
                                        value={base.p2}
                                        onChange={handleBaseChange}
                                        maxLength={4}
                                        inputMode="numeric"
                                        className="w-[90px] rounded border px-2 py-2"
                                        placeholder="1234"
                                    />
                                    <span>-</span>
                                    <input
                                        type="text"
                                        name="p3"
                                        value={base.p3}
                                        onChange={handleBaseChange}
                                        maxLength={4}
                                        inputMode="numeric"
                                        className="w-[90px] rounded border px-2 py-2"
                                        placeholder="5678"
                                    />
                                </div>
                            )}
                        </div>
                    </div>                        
                </div>

                {/* 입력 폼 */}
                <form onSubmit={handleSubmit} className="rounded-xl border">
                    <div 
                        className="
                            md:text-base text-[clamp(12px,2.085vw,16px)]
                            px-6 py-4 border-b font-semibold">추가 정보 입력</div>

                    <div 
                        className="
                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                            md:p-6 md:grid md:grid-cols-2 
                            flex flex-col p-6 gap-6">
                        <div className="flex flex-col">
                            <label className="font-medium mb-1">작가명 (닉네임) <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                name="nickname"
                                value={form.nickname}
                                onChange={handleChange}
                                className="border rounded px-3 py-2"
                                placeholder="예) diasec"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="font-medium mb-1">대표 작품 제목 <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                className="border rounded px-3 py-2"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="font-medium mb-1">작가 소개 <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="border rounded px-3 py-2"
                                placeholder="작품 성향, 경력, 전시 이력 등"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="font-medium mb-1">대표 작품 업로드 <span className="text-red-500">*</span></label>
                            <input 
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="border rounded px-3 py-2"
                            />
                        </div>

                        <div className="flex flex-col col-span-2">
                            <label className="font-medium mb-1">포트폴리오 링크</label>
                            <input 
                                type="url"
                                name="portfolio"
                                value={form.portfolio}
                                onChange={handleChange}
                                className="border rounded px-3 py-2"
                                placeholder="Behance / Notion / 개인사이트 등"
                            />
                        </div>

                        {/* 계좌 */}
                        <div className="col-span-2 mt-2">
                            <div 
                                className="
                                    md:text-base text-[clamp(11px,2.085vw,16px)]
                                    font-semibold mb-3">정산 계좌 정보 (판매 수익 10%) <span className="text-red-500">*</span></div>
                            <div 
                                className="
                                    md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                    grid grid-cols-3 md:gap-4 gap-1">
                                <input 
                                    type="text"
                                    name="accountHolder"
                                    value={form.accountHolder}
                                    onChange={handleChange}
                                    className="border rounded px-3 py-2"
                                    placeholder="예금주"
                                />
                                <input 
                                    type="text"
                                    name="bank"
                                    value={form.bank}
                                    onChange={handleChange}
                                    className="border rounded px-3 py-2"
                                    placeholder="은행명"
                                />
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={form.accountNumber}
                                    onChange={handleChange}
                                    className="border rounded px-3 py-2"
                                    placeholder="계좌번호"
                                />
                            </div>
                        </div>
                            
                        <label 
                            className="
                                md:text-base text-[clamp(10px,2.085vw,16px)]
                                col-span-2 flex items-start gap-2 text-sm mt-2">
                            <input 
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="mt-1"
                            />
                            <span>판매 수익의 13% 정산 및 작가 운영 정책에 동의합니다.</span>
                        </label>
                    </div>
                    <div className="w-full mb-4 text-center">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="
                            md:px-6 px-2 md:py-4 py-1
                            md:text-base text-[clamp(11px,2.085vw,16px)]
                            bg-black text-white rounded hover:bg-gray-800 disabled:opacity-60"
                        >
                            {submitting ? '제출 중...' : '신청하기'}
                        </button>
                    </div>
                </form>
            </>
            
        </div>       
    )
}

export default AuthorRegisterForm;