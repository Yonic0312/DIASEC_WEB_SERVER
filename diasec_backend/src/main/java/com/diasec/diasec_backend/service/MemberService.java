package com.diasec.diasec_backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.AuthorMapper;
import com.diasec.diasec_backend.dao.CartMapper;
import com.diasec.diasec_backend.dao.CreditMapper;
import com.diasec.diasec_backend.dao.DeliveryAddressMapper;
import com.diasec.diasec_backend.dao.MemberMapper;
import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.dao.WishlistMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.MemberVo;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberService {
    
    private final MemberMapper memberMapper;
    private final DeliveryAddressMapper deliveryAddressMapper;
    private final WishlistMapper wishlistMapper;
    private final CartMapper cartMapper;
    private final OrderMapper orderMapper;
    private final CreditMapper creditMapper;
    private final AuthorMapper authorMapper;
    private final ImageUtil imageUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final CreditService creditService;

    public void registerMember(MemberVo member) {
        memberMapper.registerMember(member);
    }

    public boolean isDuplicatedId(String id) {
        return memberMapper.selectMemberById(id) != null;
    }

    // 이메일 중복체크
    public boolean isDuplicatedEmail(String email) {
        return memberMapper.selectMemberByEmail(email) != null;
    }

    // 전화번호 중복체크
    public boolean isDuplicatedPhone(String phone) {
        return memberMapper.countByPhone(phone) > 0;
    }

    public MemberVo selectMemberById(String id) {
        return memberMapper.selectMemberById(id);
    }

    public void modifyPassword(String id, String password) {
        memberMapper.updatePassword(id, password);
    }

    public void updateMember(MemberVo member) {
        memberMapper.updateMember(member);
    }

    public boolean login(String id, String rawPassword) {
        MemberVo member = memberMapper.selectMemberById(id);
        if (member == null) {
            return false;
        } 
        return passwordEncoder.matches(rawPassword, member.getPassword()); // true면 로그인 성공
    }

    public MemberVo selectMemberByNameAndEmail(MemberVo member) {
        return memberMapper.selectMemberByNameAndEmail(member);
    }

    public MemberVo selectMemberByNameAndPhone(MemberVo member) {
        return memberMapper.selectMemberByNameAndPhone(member);
    }

    public MemberVo resetPasswordWithTempPassword(MemberVo member) {
        MemberVo user = memberMapper.findByIdNameAndEmailOrPhone(member);
        
        if (user == null) return null;

        // 임시 비밀번호 생성
        String tempPwd = UUID.randomUUID().toString().substring(0, 10);

        // 암호화
        String encodedPwd = passwordEncoder.encode(tempPwd);
        memberMapper.updatePassword(member.getId(), encodedPwd);

        // 이메일 발송
        mailService.sendTempPassword(user.getEmail(), tempPwd);

        return user;   
    }

    public String getRoleByEmailAndProvider(String email, String provider) {
        return memberMapper.getRoleByEmailAndProvider(email, provider);
    }

    public MemberVo findByEmailAndProvider(String email, String provider) {
        return memberMapper.findByEmailAndProvider(email, provider);
    }

    // 회원탈퇴
    @Transactional
    public void deleteMember(String id) {
        // [author_image 테이블 정보 삭제]
        List<Map<String, Object>> authorImages = authorMapper.selectAuthorImages(id);// 이미지 삭제
        for (Map<String, Object> img : authorImages) {
            String imageUrl = (String) img.get("image_url");
            if (imageUrl != null && !imageUrl.isEmpty()) {
                imageUtil.deleteImage(imageUrl);
            }
        }
        System.out.println("이미지 삭제@@");

        authorMapper.deleteAuthorById(id); // 테이블 정보 삭제
        System.out.println("작가 테이블 삭제@@");
        
        // member 테이블 정보 삭제
        memberMapper.deleteMember(id); 
        System.out.println("member 테이블 삭제@@");
        
        // delivery_address 테이블 정보 삭제
        deliveryAddressMapper.deleteAddressByMemberId(id);
        System.out.println("주소 테이블 삭제@@");
        
        // wishlist 테이블 정보 삭제
        wishlistMapper.deleteByUserId(id);
        System.out.println("위시리스트 테이블 삭제@@");
        
        // cart 테이블 정보 삭제
        cartMapper.deleteCartItemsById(id);
        System.out.println("카트 테이블 삭제@@");
        
        // orders 테이블 정보 삭제 (order_items 테이블도)
        orderMapper.deleteOrdersById(id);
        System.out.println("주문 테이블 삭제@@");
        
        // credit_history 테이블 정보 삭제
        creditMapper.deleteCreditById(id);
        System.out.println("적립금 테이블 삭제@@");
    }   

    // 카카오 로그인
    public void processOAuthLogin(String email, String nickname, String provider) {
        MemberVo existingUser = memberMapper.findByEmailAndProvider(email, provider);
        if (existingUser == null) {
            MemberVo newUser = new MemberVo();

            String generatedId = provider + "_" + UUID.randomUUID().toString ().substring(0, 8);
            String defaultName = provider.equals("kakao") ? "카카오 사용자" : 
                                 provider.equals("naver") ? "네이버 사용자" : "소셜 사용자";

            newUser.setId(generatedId);
            newUser.setPassword("SOCIAL");
            newUser.setName(defaultName);
            newUser.setPhone("000-0000-0000");
            newUser.setEmail(email);
            newUser.setNickname(nickname != null ? nickname : defaultName);
            newUser.setProvider(provider);
    
            memberMapper.insertMember(newUser);
            System.out.println("[✅ 소셜 회원가입 완료] " + email);
        } else {
            System.out.println("[🔁 기존 소셜 사용자 로그인] " + email);
        }
    }

    // 모든 회원 목록 가져오기
    public List<MemberVo> getAllMembers() {
        return memberMapper.getAllMembers();
    }

    // 회원 역할 변경
    public void updateRole(String id, String role) {
        memberMapper.updateRole(id, role);
    }

    public void linkKakao(String id, String kakaoUid) {
        memberMapper.updateKakaoUid(id, kakaoUid);
    }

    public void linkNaver(String id, String naverUid) {
        memberMapper.updateNaverUid(id, naverUid);
    }

    public MemberVo selectMemberByEmail(String email) {
        return memberMapper.selectMemberByEmail(email);
    }

    public MemberVo findByProviderUid(String provider, String providerUid) {
        if ("kakao".equals(provider)) return memberMapper.selectByKakaoUid(providerUid);
        if ("naver".equals(provider)) return memberMapper.selectByNaverUid(providerUid);
        return null;
    }

    public MemberVo findWebMemberByEmail(String email) {
        // provider가 web 이면서 email이 같은 회원
        return memberMapper.selectWebMemberByEmail(email);
    }

    @Transactional
    public void createSocialMember(String email, String nickname, String provider, String providerUid) {
        MemberVo vo = new MemberVo();
        vo.setEmail(email);
        vo.setNickname(nickname);
        vo.setName((nickname != null && !nickname.isBlank()) ? nickname : "소셜회원");
        vo.setProvider(provider);
        vo.setRole("USER");
        vo.setSmsAgree(true);
        vo.setEmailAgree(true);

        // web회원처럼 id/password가 없으니:
        // id는 이메일 앞부분+UUID 같은 걸로 생성하거나, DB가 id PK면 필수임
        vo.setId(generateSocialId(provider, providerUid));

        vo.setPassword("SOCIAL");

        // UID 저장
        if ("kakao".equals(provider)) vo.setKakao_uid(providerUid);
        if ("naver".equals(provider)) vo.setNaver_uid(providerUid);

        memberMapper.insertSocialMember(vo);

        CreditVo welcomeCredit = new CreditVo();
        welcomeCredit.setId(vo.getId());
        welcomeCredit.setType("적립");
        welcomeCredit.setAmount(5000);
        welcomeCredit.setDescription("회원가입 축하 적립");
        creditService.insertCreditHistory(welcomeCredit);
    }

    private String generateSocialId(String provider, String providerUid) {
        // n + 15자리 해시 = 총 16자리
        String prefix = "kakao".equals(provider) ? "k" : "n";
        String source = provider + ":" + providerUid;

        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return prefix + hex.substring(0, 15); // 총 16자
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("social id 생성 실패", e);
        }
    }


    public void linkKako(String id, String kakaoUid) {
        memberMapper.updateKakaoUid(id, kakaoUid);
    }

    // public void linkNaver(String id, String naverUid) {
    //     memberMapper.updateNaverUid(id, naverUid);
    // }

    public int selectCreditById(String id) {
        return memberMapper.selectCreditById(id);
    }
}
