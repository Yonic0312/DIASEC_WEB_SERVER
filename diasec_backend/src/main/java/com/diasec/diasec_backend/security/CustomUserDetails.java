package com.diasec.diasec_backend.security;

import java.util.*;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.diasec.diasec_backend.vo.MemberVo;

public class CustomUserDetails implements UserDetails {

    private final MemberVo member;

    public CustomUserDetails(MemberVo member) {
        this.member = member;
    }

    public String getEmail() {
        return member.getEmail();
    }

    public String getProvider() {
        return member.getProvider();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + member.getRole()));
    }

    @Override
    public String getPassword() {
        return member.getPassword();
    }

    @Override
    public String getUsername() {
        return member.getId();  // 또는 getEmail()로
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }

    public MemberVo getMember() {
        return member;
    }
}

