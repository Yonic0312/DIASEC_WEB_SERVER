package com.diasec.diasec_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    
    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendTempPassword(String toEmail, String tempPwd) {
        String subject = "[디아섹 KOREA] 임시 비밀번호 안내";
        String body = "안녕하세요, 디아섹 KOREA입니다.\n\n" +
                      "회원님의 요청에 따라 임시 비밀번호를 아래와 같이 발급해드렸습니다.\n\n" +
                      "임시 비밀번호: " + tempPwd + "\n\n" +
                      "보안을 위해 로그인 후 반드시 마이페이지에서 새 비밀번호로 변경해주시기 바랍니다.\n" +
                      "혹시 본인이 요청한 내용이 아닌 경우, 고객센터로 즉시 문의해주세요.\n\n" +
                      "감사합니다.\n\n" +
                      "디아섹 KOREA 드림";
    
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
    
}
