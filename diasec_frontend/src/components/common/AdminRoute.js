import { Navigate } from 'react-router-dom';
import { useMember } from '../../context/MemberContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminRoute = ({ children }) => {
    const { member, setMember } = useMember();
    const [checking, setChecking] = useState(!member);
    const API = process.env.REACT_APP_API_BASE;

    useEffect(() => {
        if (member) {
            setChecking(false);
            return;
        }

        axios.get(`${API}/member/me`, { withCredentials: true })
            .then((res) => {
                if (res.data?.loggedIn !== false) setMember(res.data);
            })
            .finally(() => setChecking(false));
    }, [member, setMember, API]);

    if (checking) return null;

    if (!member || member.loggedIn === false) {
        return <Navigate to="/userLogin" replace />;
    }

    if (member.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;