import { useEffect, useState } from 'react';
import axios from 'axios';

export function usePartnerNavVisible(member) {
    const API = process.env.REACT_APP_API_BASE;
    const [visible, setVisible] = useState(Boolean(member?.partnerStatus));

    useEffect(() => {
        if (!member?.id) {
            setVisible(false);
            return;
        }

        if (member.partnerStatus) {
            setVisible(true);
            return;
        }

        axios
            .get(`${API}/biz-partner/my-status`, { withCredentials: true })
            .then((res) => {
                const status = res.data?.partnerStatus ?? '없음';
                setVisible(status !== '없음');
            })
            .catch(() => setVisible(false));
    }, [API, member?.id, member?.partnerStatus]);

    return visible;
}