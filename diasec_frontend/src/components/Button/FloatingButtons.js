import { useContext } from "react";
import { ShoppingCart, ArrowUp } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';

const FloatingButtons = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { member } = useContext(MemberContext);

    const isCartPage = pathname === '/cart';

    return (
        <div className="fixed bottom-28 right-8 flex flex-col gap-2 md:gap-3 z-[100]">
            {!isCartPage && (
                <button
                    type="button"
                    onClick={() => {
                        if (!member) {
                            toast.warn('로그인이 필요합니다.');
                            return;
                        }
                        navigate("/cart")
                    }}
                    className="flex items-center justify-center 
                        xl:w-16 lg:w-14 md:w-12 w-[42px]
                        xl:h-16 lg:h-14 md:h-12 h-[42px]
                        p-2 md:p-3 rounded-full bg-[#a67a3e] text-white shadow-lg hover:bg-[#8b652f] transition"
                    aria-label="장바구니"
                >
                    <ShoppingCart/>
                </button>
            )}

            <button
                type="button"
                onClick={() => window.scrollTo({ top:0, behavior: "smooth" })}
                className="flex items-center justify-center 
                xl:w-16 lg:w-14 md:w-12 w-[42px]
                xl:h-16 lg:h-14 md:h-12 h-[42px]
                p-2 md:p-3 rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-900 transition"
                aria-label="맨 위로"
            >
                <ArrowUp/>
            </button>
        </div>
    )
}

export default FloatingButtons;