import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useMember } from "../../../context/MemberContext";

axios.defaults.withCredentials = true;

export default function LinkSocial() {
    const API = process.env.REACT_APP_API_BASE;
    const api = useMemo(() => axios.create({ baseURL: API, withCredentials: true }), [API]);

    const navigate = useNavigate();
    const { setMember } = useMember();

    const [maskedId, setMaskedId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const pwRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/member/link-social/pending");
                setMaskedId(res.data?.maskedId || "");
                if (!res.data?.maskedId) throw new Error("no maskedId");
            } catch (e) {
                toast.error('연동 정보를 불러올 수 없습니다. 소셜 로그인을 다시 시도해주세요.');
                navigate("/userLogin");
            }
        })();
    }, [api, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const _pw = password.trim();
        if (!_pw) {
            toast.error("비밀번호를 입력해 주세요.");
            pwRef.current?.focus();
            return;
        }

        try {
            setLoading(true);

            // 연동 요청
            const res = await api.post("/member/link-social", { password: _pw});

            if (!res.data?.success) {
                toast.error(res.data?.message || "연동에 실패했습니다.");
                return;
            }

            // 연동 성공 -> 내 정보 갱신
            const profile = await api.get("/member/me");
            setMember(profile.data);

            toast.success("계정 연동이 완료되었습니다.");
            navigate("/");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "연동 처리 중 오류가 발생했습니다.";
                toast.error(msg);
                console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[70vh] flex items-center justify-center px-4 mt-5">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold mb-2">계정 연동</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        아래 아이디 계정에 지금 진행 중인 소셜 계정을 연결합니다. <br />
                        <span className="text-gray-700 font-medium">본인 확인을 위해 해당 계정의 비밀번호</span>를 입력해 주세요.<br />
                        연동이 완료되면 다음부터는 <span className="text-gray-700 font-medium">비밀번호 없이 소셜 로그인</span>으로 바로 로그인할 수 있어요.
                    </p>
                </div>

                {/* 마스킹 아이디 표시 */}
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <div className="text-gray-500">연동할 계정 아이디</div>
                    <div className="mt-1 font-semibold text-gray-900">
                        {maskedId ? maskedId : "확인 중..."}
                    </div>
                </div>

                {/* 폼 */}
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[13px] text-gray-600">비밀번호</label>
                        <input
                            ref={pwRef}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 px-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                            autoComplete="current-password"
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {/* 연동버튼 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            h-11 mt-2
                            bg-black text-white rounded-md font-medium
                            text-[14px] md:text-base
                            hover:bg-gray-900
                            transition
                            disabled:opacity-60
                        "
                    >
                        {loading ? "연동 중..." : "계정 연동하기"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="
                            h-11 border border-gray-300 rounded-md
                            text-[14px] md:text-base
                            text-gray-700
                            hover:bg-gray-50
                            transition
                        "
                    >
                        로그인 화면으로 돌아가기
                    </button>
                </form>
            </div>
        </div>
    )
}