import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useMember } from './MemberContext';

const PartnerContext = createContext({
    partnerDiscount: 0,
    refreshPartner: () => {},
});

export const usePartner = () => useContext(PartnerContext);

export const PartnerProvider = ({ children }) => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useMember();
    const location = useLocation();
    const [partnerDiscount, setPartnerDiscount] = useState(0);

    const refreshPartner = useCallback(() => {
        if (!member?.id) {
            setPartnerDiscount(0);
            return;
        }

        axios
            .get(`${API}/biz-partner/my-status`, { withCredentials: true })
            .then((res) => {
                const d =
                    res.data?.partnerStatus === '승인'
                        ? Number(res.data.discountPercent) || 0
                        : 0;
                setPartnerDiscount(d);
            })
            .catch(() => setPartnerDiscount(0));
    }, [API, member?.id]);

    // 로그인/로그아웃, 페이지 이동 시 갱신 (관리자 승인 후에도 반영)
    useEffect(() => {
        refreshPartner();
    }, [refreshPartner, location.pathname]);

    return (
        <PartnerContext.Provider value={{ partnerDiscount, refreshPartner }}>
            {children}
        </PartnerContext.Provider>
    );
}; 

