import { createContext, useContext, useState} from 'react';

// 리액트의 전역 상태 저장소 생성 (로그인된 회원 정보를 보관)
export const MemberContext = createContext();

// 호출하면 member와 setMember를 손쉽게 사용
export const useMember = () => useContext(MemberContext);

// App.js에서 감싸면 member 상태를 공유할 수 있게 됨
export const MemberProvider = ({ children }) => {
    const [member, setMember ] = useState(null);

    return (
        <MemberContext.Provider value={{ member, setMember }}>
            {children}
        </MemberContext.Provider>
    )
}