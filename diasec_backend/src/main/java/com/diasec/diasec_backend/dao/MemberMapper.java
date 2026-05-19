package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.diasec.diasec_backend.vo.MemberVo;

@Mapper
public interface MemberMapper {
    
    void registerMember(MemberVo member);

    MemberVo selectMemberById(String id);

    MemberVo selectMemberByEmail(String email);

    int countByPhone(@Param("phone") String phone);

    MemberVo selectMemberByNameAndEmail(MemberVo member);

    MemberVo selectMemberByNameAndPhone(MemberVo member);

    MemberVo findByIdNameAndEmailOrPhone(MemberVo member);

    String getRoleByEmailAndProvider(@Param("email") String email, @Param("provider") String provider);

    void updateMember(MemberVo member);

    void updatePassword(String id, String password);

    void deleteMember(String id);

    // 카카오 로그인
    MemberVo findByEmailAndProvider(String email, String provider);
    void insertMember(MemberVo member);

    // 모든 회원 목록 가져오기
    List<MemberVo> getAllMembers();

    // 회원 역할 변경
    void updateRole(String id, String role);

    // void updateKakaoUid(String id, String kakaoUid);

    // void updateNaverUid(String id, String naverUid);

    MemberVo selectByKakaoUid(String kakaoUid);
    MemberVo selectByNaverUid(String naverUid);

    MemberVo selectWebMemberByEmail(String email);
    // MemberVo selectMemberByEmail(String email);

    int insertSocialMember(MemberVo member);

    int updateKakaoUid(@Param("id") String id, @Param("kakaoUid") String kakaoUid);
    int updateNaverUid(@Param("id") String id, @Param("naverUid") String naverUid);

    int selectCreditById(String id);
}
