import { useEffect, useState, useContext } from "react";
import { ShoppingCart, ArrowUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';

const FloatingButtons = () => {
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [showScrollTop, setShowScrollTop] = useState(false);

    return (
        <div className="fixed bottom-28 right-3 flex flex-col gap-3 z-50">
            <button
                onClick={() => {
                    if (!member) {
                        toast.warn('로그인 후 이용해주세요.');
                        return;
                    }
                    navigate("/cart")
                }}
                className="flex items-center justify-center 
                xl:w-16 lg:w-14 md:w-12 w-[42px]
                xl:h-16 lg:h-14 md:h-12 h-[42px]
                p-3 rounded-full bg-[#a67a3e] text-white shadow-lg hover:bg-[#8b652f] transition"
            >
                <ShoppingCart/>
            </button>

            <button
                onClick={() => window.scrollTo({ top:0, behavior: "smooth" })}
                className="flex items-center justify-center 
                xl:w-16 lg:w-14 md:w-12 w-[42px]
                xl:h-16 lg:h-14 md:h-12 h-[42px]
                p-3 rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-900 transition"
            >
                <ArrowUp/>
            </button>
        </div>
    )
}

export default FloatingButtons;