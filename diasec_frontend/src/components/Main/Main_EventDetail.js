import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Main_EventDetail = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);

    useEffect(() => {
        fetch(`${API}/event/${id}`)
            .then(res => res.json())
            .then(data => setEvent(data))
            .catch(err => console.error("이벤트 상세 불러오기 실패", err));
    }, [id]);

    if (!event) return <div className="text-center p-20">로딩중...</div>

    return (
        <div className="w-full mx-auto px-4 py-20">
            {/* 돌아가기 버튼 */}
            <div 
                className="
                    text-right">
                <button
                    onClick={() => navigate(-1)}
                    className="
                        md:text-base text-[clamp(10px,2.085vw,16px)] 
                        px-4 py-2 mb-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                    이전으로
                </button>
            </div>

            {/* 제목 + 날짜 */}
            <div className="flex justify-between items-center border-t border-b border-gray-300 py-4 text-sm">
                <span className="text-xl font-medium">[이벤트] {event.title}</span>
                <span className="text-[16px] text-gray-500">{event.createdAt?.slice(0, 19).replace('T', ' ')}</span>
            </div>

            {/* 본문 내용 */}
            <div className="mt-3 mb-3 text-lg">
                <span>{event.content}</span>
            </div>

            {/* 상세 이미지 */}
            <div>
                <img 
                    src={event.detailImageUrl}
                    alt={event.title}
                    className="w-full object-contain"
                />
            </div>

            {/* 돌아가기 버튼 */}
            <div 
                className="
                    md:text-base text-[clamp(10px,2.085vw,16px)]
                    mt-12 text-center">
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                    이전으로 돌아가기
                </button>
            </div>
        </div>
    )
}

export default Main_EventDetail;