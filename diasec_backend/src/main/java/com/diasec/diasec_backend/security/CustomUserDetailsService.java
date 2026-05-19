package com.diasec.diasec_backend.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.MemberMapper;
import com.diasec.diasec_backend.vo.MemberVo;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberMapper memberMapper;

    public CustomUserDetailsService(MemberMapper memberMapper) {
        this.memberMapper = memberMapper;
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        MemberVo member = memberMapper.selectMemberById(username);
        if (member == null) {
            throw new UsernameNotFoundException("회원 정보를 찾을 수 없습니다: " + username);
        }
        return new CustomUserDetails(member);
    }

}
