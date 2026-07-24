import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { setSiteWideDiscountPercent, getSiteWideDiscountPercent } from '../config/sitePromo';

const SitePromoContext = createContext({
    siteDiscountPercent: 20,
    refreshSiteDiscount: () => {},
    setSiteDiscountLocal: () => {},
});

export const useSitePromo = () => useContext(SitePromoContext);

export const SitePromoProvider = ({ children }) => {
    const API = process.env.REACT_APP_API_BASE;
    const [siteDiscountPercent, setSiteDiscountPercent] = useState(getSiteWideDiscountPercent());

    const refreshSiteDiscount = useCallback(() => {
        axios
            .get(`${API}/site-setting/discount`)
            .then((res) => {
                const p = setSiteWideDiscountPercent(res.data?.siteDiscountPercent);
                setSiteDiscountPercent(p);
            })
            .catch(() => {});
    }, [API]);

    const setSiteDiscountLocal = useCallback((percent) => {
        const p = setSiteWideDiscountPercent(percent);
        setSiteDiscountPercent(p);
    }, []);

    useEffect(() => {
        refreshSiteDiscount();
    }, [refreshSiteDiscount]);

    return (
        <SitePromoContext.Provider
            value={{ siteDiscountPercent, refreshSiteDiscount, setSiteDiscountLocal }}
        >
            {children}
        </SitePromoContext.Provider>
    );
};
