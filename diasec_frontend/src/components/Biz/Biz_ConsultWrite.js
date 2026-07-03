import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast} from 'react-toastify';

const SIZE_OPTIONS = ['상관없음', '약 70x60cm', '약 100x80cm', '약 120x90cm', '약 160x130cm', '약 190x130cm 이상'];
const ARTWORK_OPTIONS = ['명화', '사진•일러스트', '풍수', '동양화', '맞춤액자'];
const THEME_OPTIONS = ['상관없음', '인물', '풍경', '정물', '동물', '상상', '추상'];
const ATMOSPHERE_OPTIONS = ['상관없음', '따듯함', '시원함', '가벼움', '묵직함', '흑백'];
const QUANTITY_OPTIONS = ['5점이하', '5~10점', '10~30점', '30점 이상'];
const BUDGET_OPTIONS = ['100만원 이하', '100~300만원', '300~500만원', '500~1000만원', '1000만원 이상'];

const CATEGORY_LINKS = [
    { label: '명화', url: '/main_Items?type=masterPiece' },
    { label: '동양화', url: '/main_Items?type=koreanPainting'},
    { label: '사진/일러스트', url: '/main_Items?type=photoIllustration'},
    { label: '풍수그림', url: '/main_Items?type=fengShui' },
    { label: '맞춤액자/사진보정', url: '/customFrames' },
];

const DRAFT_STORAGE_KEY = 'bizConsultWriteDraft';

const EMPTY_FORM = {
    companyName: '', deptManagerTitle: '', email: '',
    phone1: '', phone2: '', phone3: '',
    installPlace: '', etcInquiry: '',
    password: '', privacyAgreed: false,
};

const saveDraft = (draft) => {
    try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {

    }
};

const loadDraft = () => {
    try {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const clearDraft = () => {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

const toggleGroup = (prev, value) => {
    if (value === '상관없음') return ['상관없음'];
    const next = prev.filter(v => v !== '상관없음');
    return next.includes(value) ? next.filter(v => v !== value) : [...next, value];
};

const toggleExclusiveGroup = (prev, value, exclusiveValue) => {
    if (value === exclusiveValue) return [exclusiveValue];
    const next = prev.filter((v) => v !== exclusiveValue);
    return next.includes(value) ? next.filter((v) => v !== value) : [...next, value];
};

const CheckboxGroup = ({ label, options, values, onChange, required = false, sectionRef, toggleFn = toggleGroup }) => (
    <div ref={sectionRef}>
        <label className="block text-sm font-medium mb-2">
            {label}{required && <span className="text-red-500"> *</span>}
        </label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={values.includes(opt)}
                        onChange={() => onChange(toggleFn(values, opt))}
                    />
                    {opt}
                </label>
            ))}
        </div>
    </div>
);

const Biz_ConsultWrite = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_FORM);
    const [draftRestored, setDraftRestored] = useState(false);
    const [sizes, setSizes] = useState([]);
    const [quantities, setQuantities] = useState([]);
    const [artworkTypes, setArtworkTypes] = useState([]);
    const [themes, setThemes] = useState([]);
    const [atmospheres, setAtmospheres] = useState([]);
    const [images, setImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [budgets, setBudgets] = useState([]);
    

    // 포커스 헬퍼
    const companyNameRef = useRef(null);
    const deptManagerTitleRef = useRef(null);
    const emailRef = useRef(null);
    const phone1Ref = useRef(null);
    const sizesRef = useRef(null);
    const artworkTypesRef = useRef(null);
    const themesRef = useRef(null);
    const atmospheresRef = useRef(null);
    const passwordRef = useRef(null);
    const privacyRef = useRef(null);
    const quantityRef = useRef(null);
    const submittingRef = useRef(false);
    const budgetRef = useRef(null);

    useEffect(() => {
        const draft = loadDraft();
        if (!draft) return;

        if (draft.form) setForm({ ...EMPTY_FORM, ...draft.form });
        if (Array.isArray(draft.sizes)) setSizes(draft.sizes);
        if (Array.isArray(draft.quantities)) setQuantities(draft.quantities);
        if (Array.isArray(draft.artworkTypes)) setArtworkTypes(draft.artworkTypes);
        if (Array.isArray(draft.themes)) setThemes(draft.themes);
        if (Array.isArray(draft.atmospheres)) setAtmospheres(draft.atmospheres);
        if (Array.isArray(draft.budgets)) setBudgets(draft.budgets);

        setDraftRestored(true);
        toast.info('이전에 작성하던 내용을 불러왔습니다. (첨부 이미지는 다시 선택해 주세요.)');
    }, []);

    const buildDraft = () => ({
        form,
        sizes,
        quantities,
        artworkTypes,
        themes,
        atmospheres,
        budgets,
    });

    const persistDraftAndNavigate = (path) => {
        saveDraft(buildDraft());
        navigate(path);
    };



    const focusInput = (ref) => {
        const el = ref.current;
        if (!el) return;
        setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center'});
            el.focus({ preventScroll: true });
        }, 100);
    };

    const focusSection = (ref) => {
        const el = ref.current;
        if (!el) return;
        setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.querySelector('input[type="checkbox"]')?.focus({ preventScroll: true });
        }, 100);
    };

    const warnAndFocus = (message, ref, type = 'input') => {
        toast.warn(message);
        if (type === 'section') focusSection(ref);
        else focusInput(ref);
        return false;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const addImages = (incomingFiles) => {
        const valid = incomingFiles.filter(f => 
            ['image/jpeg', 'image/png'].includes(f.type) && f.size <= 5 * 1024 * 1024
        );

        if (valid.length !== incomingFiles.length) {
            toast.error('jpg/png, 파일당 5MB 이하만 가능합니다.');
        }
        if (valid.length === 0) return;

        setImages((prev) => {
            const combined = [...prev, ...valid];
            if (combined.length > 20) {
                toast.warn('최대 20개까지 업로드 가능합니다.');
                return combined.slice(0, 20);
            }
            return combined;
        });
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) addImages(files);
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) addImages(files);
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (submittingRef.current) return;

        const phone = [form.phone1, form.phone2, form.phone3].filter(Boolean).join('-');
        if (!form.companyName) { warnAndFocus('회사명을 입력해주세요.', companyNameRef); return; }
        if (!form.deptManagerTitle) { warnAndFocus('부서/담당자명/직함을 입력해주세요.', deptManagerTitleRef); return; }
        if (!form.email) { warnAndFocus('이메일을 입력해주세요.', emailRef); return; }
        if (!phone) { warnAndFocus('연락처를 입력해주세요.', phone1Ref); return; }
        if (quantities.length === 0) { warnAndFocus('수량을 선택해주세요.', quantityRef, 'section'); return;}
        if (budgets.length === 0) { warnAndFocus('예산금액을 선택해주세요.', budgetRef, 'section'); return; }
        if (sizes.length === 0) { warnAndFocus('사이즈를 선택해주세요.', sizesRef, 'section'); return; }
        if (artworkTypes.length === 0) { warnAndFocus('작품 종류를 선택해주세요.', artworkTypesRef, 'section'); return; }
        if (themes.length === 0) { warnAndFocus('테마를 선택해주세요.', themesRef, 'section'); return; }
        if (atmospheres.length === 0) { warnAndFocus('분위기를 선택해주세요.', atmospheresRef, 'section'); return; }

        if (!form.password) { warnAndFocus('비밀번호를 입력해주세요.', passwordRef); return; }
        if (form.privacyAgreed !== true) { 
            warnAndFocus('개인정보 수집·이용에 동의해주세요.', privacyRef, 'section'); 
            return; 
        }
        
        submittingRef.current = true;
        setIsSubmitting(true);

        const data = new FormData();
        data.append('companyName', form.companyName);
        data.append('deptManagerTitle', form.deptManagerTitle);
        data.append('email', form.email);
        data.append('phone', phone);
        data.append('quantity', quantities.join(','));
        data.append('budget', budgets.join(','));
        data.append('sizes', sizes.join(','));
        data.append('artworkTypes', artworkTypes.join(','));
        data.append('themes', themes.join(','));
        data.append('atmostpheres', atmospheres.join(','));
        data.append('installPlace', form.installPlace);
        data.append('etcInquiry', form.etcInquiry);
        data.append('password', form.password);
        data.append('privacyAgreed', '1');
        images.forEach((file) => data.append('files', file));

        try {
            await axios.post(`${API}/biz-consult/register`, data);
            clearDraft();
            alert(
                '신청 접수가 완료되었습니다.\n' +
                '기업컨설팅 리스트에서 비밀번호로 확인 가능합니다.\n\n' +
                '(전송 완료된 내용은 직접 수정 및 삭제가 불가하오니, 변경을 원하시면 고객센터로 문의해 주세요.)\n' +
                '영업일 기준 48시간 이내에 입력하신 이메일로 답변드리겠습니다.'
            );
            navigate('/bizConsultList');
        } catch {
            submittingRef.current = false;
            setIsSubmitting(false);
            toast.error('등록 중 오류가 발생했습니다.');
        }
    };
    
    return (
        <div className="w-full px-4 mt-20 mb-16 break-keep">
            <div className="max-w-3xl mx-auto">
                <h2 className="md:text-3xl text-[clamp(18px,3.91vw,30px)] text-center font-bold mb-4">
                    기업컨설팅
                </h2>
                {/* <p className="text-center text-gray-600 mb-2">디아섹코리아의 기업 전용 서비스</p> */}
                <div className="text-center text-gray-700 mb-5 space-y-1">
                    <p className="font-medium">어떤 작품을 선택해야 할지 고민이신가요?</p>
                    <p className="text-sm">공간의 용도와 분위기에 맞춰 전문 컨설턴트가 작품 선정부터 제작·설치까지 도와드립니다.</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-5 text-sm">
                    <span className="text-gray-500">작품 목록보기 →</span>
                    {CATEGORY_LINKS.map(({ label, url }) => (
                       <button
                        key={label}
                        type="button"
                        onClick={() => persistDraftAndNavigate(url)}
                        className="px-2 py-1 border rounded hover:bg-gray-50"
                       >
                            {label}
                       </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="border p-4 rounded-md space-y-6">
                    {/* 필수 텍스트 필드 */}
                    <div>
                        <label className="block text-sm mb-1">회사명 <span className="text-red-500">*</span></label>
                        <input ref={companyNameRef} name="companyName" type="text" value={form.companyName} onChange={handleChange}
                            className="w-full border p-2 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">부서 / 담당자 명 / 직함 <span className="text-red-500">*</span></label>
                        <input ref={deptManagerTitleRef} name="deptManagerTitle" type="text" value={form.deptManagerTitle} onChange={handleChange}
                            className="w-full border p-2 rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">이메일 <span className="text-red-500">*</span></label>
                        <input ref={emailRef} name="email" type="email" value={form.email} onChange={handleChange}
                            className="w-full border p-2 rounded"/>
                    </div>

                    {/* 연락처 3칸 */}
                    <div>
                        <label className="block text-sm mb-1">연락처 <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2">
                            <input ref={phone1Ref} name="phone1" maxLength={3} value={form.phone1} onChange={handleChange} 
                                className="w-[76px] border p-2 rounded text-center" placeholder="010" />
                            <span>-</span>
                            <input name="phone2" maxLength={4} value={form.phone2} onChange={handleChange} 
                                className="w-[76px] border p-2 rounded text-center" placeholder="1234" />
                            <span>-</span>
                            <input name="phone3" maxLength={4} value={form.phone3} onChange={handleChange} 
                                className="w-[76px] border p-2 rounded text-center" placeholder="5678" />
                        </div>
                    </div>

                    <CheckboxGroup 
                        label="수량"
                        options={QUANTITY_OPTIONS}
                        values={quantities}
                        onChange={setQuantities}
                        toggleFn={(prev, value) => toggleExclusiveGroup(prev, value, '미정')}
                        required
                        sectionRef={quantityRef}
                    />

                    <CheckboxGroup 
                        label="예산금액"
                        options={BUDGET_OPTIONS}
                        values={budgets}
                        onChange={setBudgets}
                        toggleFn={(prev, value) => toggleExclusiveGroup(prev, value, '미정')}
                        required
                        sectionRef={budgetRef}
                    />
                    
                    <CheckboxGroup label="사이즈" options={SIZE_OPTIONS} values={sizes} onChange={setSizes} required sectionRef={sizesRef} />
                    <CheckboxGroup label="작품 종류" options={ARTWORK_OPTIONS} values={artworkTypes} onChange={setArtworkTypes} required sectionRef={artworkTypesRef} />
                    <CheckboxGroup label="테마" options={THEME_OPTIONS} values={themes} onChange={setThemes} required sectionRef={themesRef} />
                    <CheckboxGroup label="분위기" options={ATMOSPHERE_OPTIONS} values={atmospheres} onChange={setAtmospheres} required sectionRef={atmospheresRef} />

                    <div>
                        <label className="block text-sm mb-1">설치 장소</label>
                        <input name="installPlace" value={form.installPlace} onChange={handleChange}
                            placeholder="기업 로비 / 병원 로비 / 호텔 로비 / 백화점입구 / 갤러리 / 모델하우스 / 기타"
                            className="w-full border p-2 rounded" />
                    </div>

                    <div>
                        <span className="block text-sm mb-1">이미지 업로드 (설치공간 사진)</span>
                        <p className="text-xs text-gray-500 mb-2">
                            jpg, png / 파일당 5MB / 최대 20개 ({images.length}/20)
                            {draftRestored && ' · 페이지 이동 시 첨부 이미지는 다시 선택해 주세요'}
                        </p>

                        <label
                            htmlFor="consultImageInput"
                            onDragEnter={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                            className={`w-full h-[140px] border-2 border-dashed flex items-center justify-center rounded-lg text-gray-500 cursor-pointer transition
                                ${isDragging ? 'border-[#D0AC88] bg-[#fff7eb]' : 'border-gray-300 hover:border-[#D0AC88]'}`}
                        >
                            <input
                                type="file"
                                id="consultImageInput"
                                multiple
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {isDragging ? '이미지를 놓으세요' : '여기를 클릭하거나 이미지를 드래그하세요'}
                        </label>

                        {images.length > 0 && (
                            <DragDropContext
                                onDragEnd={(result) => {
                                    if (!result.destination) return;
                                    const updated = Array.from(images);
                                    const [moved] = updated.splice(result.source.index, 1);
                                    updated.splice(result.destination.index, 0, moved);
                                    setImages(updated);
                                }}
                            >
                                <Droppable droppableId="consult-images" direction="horizontal">
                                    {(provided) => (
                                        <div
                                            className="flex flex-wrap gap-3 mt-3"
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {images.map((file, index) => (
                                                <Draggable
                                                    key={file.name + index}
                                                    draggableId={file.name + index}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="w-24"
                                                        >
                                                            <div className="relative w-24 h-24">
                                                                <img
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`consult-${index}`}
                                                                    className="w-full h-full object-cover border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const updated = [...images];
                                                                        updated.splice(index, 1);
                                                                        setImages(updated);
                                                                    }}
                                                                    className="absolute top-0 right-0 bg-black text-white text-xs p-1 leading-none"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                            <div className="text-xs text-center mt-1">#{index + 1}</div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm mb-1">기타 문의 사항</label>
                        <textarea name="etcInquiry" value={form.etcInquiry} onChange={handleChange}
                            placeholder='설치 목적에 대한 내용을 자유롭게 작성해 주시면 더욱 정확한 작품 추천이 가능합니다.
                                예시)
                                "기업 로비에 설치 예정이며 신뢰감과 자사브랜드 이미지와 어울리는 작품을 찾고 있습니다."
                                "병원 대기실에 설치 예정이며 환자들이 편안함을 느낄 수 있는 작품을 찾고 있습니다."
                                "호텔 로비에 설치 예정이며 고급스럽고 세련된 분위기를 원합니다."
                                "모델하우스 거실 공간에 설치 예정이며 따뜻하고 밝은 느낌의 작품을 추천받고 싶습니다."
                            '
                            className="w-full border p-2 rounded min-h-[200px]" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">비밀번호 <span className="text-red-500">*</span></label>
                        <input ref={passwordRef} name="password" type="password" value={form.password} onChange={handleChange}
                            placeholder="목록에서 본인 글 확인 시 사용" className="w-full border p-2 rounded max-w-xs" />
                    </div>

                    <div ref={privacyRef} className="flex items-center gap-2 text-sm">
                        <input 
                            id="privacyAgreed"
                            type="checkbox" 
                            name="privacyAgreed" 
                            checked={form.privacyAgreed} 
                            onChange={handleChange}
                        />
                        <label htmlFor="privacyAgreed">
                            개인정보수집 관련 이용약관 동의{' '}
                            <span className="text-red-500">*</span>{' '}
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowPrivacy(v => !v);
                                }}
                                className="text-blue-600 underline"
                            >
                                내용보기
                            </button>
                        </label>
                    </div>
                    {showPrivacy && (
                        <div className="text-xs text-gray-600 border p-4 rounded bg-gray-50 leading-relaxed">
                            수집항목: 회사명, 담당자정보, 이메일, 연락처, 설치장소, 첨부이미지 등<br />
                            이용목적: 기업컨설팅 상담 및 견적 안내<br />
                            보유기간: 상담 완료 후 1년 (관련 법령에 따름)
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 py-3 rounded text-white ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'}`}
                        >
                            {isSubmitting ? '제출 중...' : '신청하기'}
                        </button>
                        <button type="button" onClick={() => persistDraftAndNavigate('/bizConsultList')}
                            className="flex-1 border border-gray-300 py-3 rounded hover:bg-gray-50">목록보기</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Biz_ConsultWrite;