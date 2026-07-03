package com.diasec.diasec_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.diasec.diasec_backend.security.CustomUserDetailsService;
import com.diasec.diasec_backend.security.CustomUsernamePasswordAuthenticationFilter;
import com.diasec.diasec_backend.security.OAuth2FailureHandler;

import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final OAuth2FailureHandler oAuthFailureHandler;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomUserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final ClientRegistrationRepository clientRegistrationRepository;
    private final AuthenticationConfiguration authenticationConfiguration;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        CustomUsernamePasswordAuthenticationFilter customFilter =
            new CustomUsernamePasswordAuthenticationFilter(authenticationManager(authenticationConfiguration));

        customFilter.setAuthenticationFailureHandler((request, response, exception) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("로그인 실패 : " + exception.getMessage());
        });
        
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // 1. 정적/업로드
                .requestMatchers( "/uploads/**", "/css/**", "/js/**", "/img/**").permitAll()

                // 2. 공개 GET API (조회는 공개)
                .requestMatchers(HttpMethod.GET, 
                    "/api/collections/**",
                    "/api/product/**",
                    "/api/event/**",
                    "/api/faq/**",
                    "/api/notice/**",
                    "/api/review/**",
                    "/api/inquiry/list",
                    "/popupClose.html",
                    "/login/**", 
                    "/oauth2/**",
                    "/api/biz-consult/register",
                    "/api/biz-consult/list",
                    "/api/biz-consult/view/**",
                    "/api/biz-consult/check-password"
                ).permitAll()

                // [배포·동기화 주의] 나이스페이 PG 공개 경로 — 로컬 SecurityConfig로 통째 덮어쓰면 웹훅·return 403 발생
                .requestMatchers(HttpMethod.GET, "/api/payment/nicepay/check").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment/nicepay/webhook", "/api/payment/nicepay/webhook/vbank").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payment/nicepay/webhook", "/api/payment/nicepay/webhook/vbank").permitAll()
                // 결제창 return/prepare
                .requestMatchers(HttpMethod.POST, "/api/payment/nicepay/prepare").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment/nicepay/return").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payment/nicepay/return").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payment/nicepay/vbank/prepare").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment/nicepay/vbank/return").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/payment/nicepay/vbank/return").permitAll()

                // 3. 회원 관련 공개(로그인/회원가입 등)
                .requestMatchers(
                    "/api/member/login", "/api/member/register",
                    "/api/member/findId", "/api/member/findPwd",
                    "/api/member/check-id", "/api/member/check-password", 
                    "/api/member/check-email", "/api/member/me", "/api/member/check-phone", 
                    "/api/member/link-social", "/api/member/link-social/pending",
                    "/api/sms/**", "/login/**", "/oauth2/**", "/error"
                ).permitAll()

                // 방문자 집계 (비로그인 포함)
                .requestMatchers(HttpMethod.POST, "/api/visit/track").permitAll()

                 // 4. 비회원 주문 관련
                 .requestMatchers(
                    "/api/order/insert", "/api/order/guest-search", "/api/order/detail/**",
                    "/api/order/cancel", "/api/order/cancelRequest", "/api/order/guest-reset-password", "api/order/update-retouch",
                    "/api/order/retouch/*/approve", "/api/order/retouch/*/reject"
                ).permitAll()

                // 기업컨설팅 (비회원 신청·조회)
                .requestMatchers(
                    "/api/biz-consult/register",
                    "/api/biz-consult/list",
                    "/api/biz-consult/view/**",
                    "/api/biz-consult/check-password",
                    "/api/biz-consult/delete"
                ).permitAll()

                .requestMatchers(
                    "/api/biz-partner/apply",
                    "/api/biz-partner/my-status"
                ).authenticated()

                .requestMatchers(HttpMethod.POST, "/api/review/guest-eligible", "/api/review/guest-write").permitAll()

                // 5. 관리자
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/product/insert", "/api/order/delete", "/api/inquiry/answer", "/api/event/insert").hasRole("ADMIN")

                // 3. 로그인 사용자만 가능
                .requestMatchers("/api/member/**").authenticated()
                .requestMatchers("/api/order/**").authenticated()
                .requestMatchers("/api/review/**").authenticated()
                .requestMatchers("/api/wishlist/**").authenticated()
                .requestMatchers("/api/collections/**").authenticated()
                .requestMatchers("/api/inquiry/**").authenticated()
                .requestMatchers("/api/faq/**").authenticated()
                .requestMatchers("/api/notice/**").authenticated()
                .requestMatchers("/api/event/**").authenticated()
                .requestMatchers("/api/biz/**").authenticated()

                // 4. 나머지
                .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {

                    String uri = request.getRequestURI();

                    // if ("/api/member/link-social".equals(uri)) {
                    //     response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    //     response.setContentType("application/json;charset=UTF-8");
                    //     response.getWriter().write("{\"ㅡmessage\":\"아이디 또는 비밀번호가 일치하지 않습니다.\"}");
                    //     return;
                    // }

                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"인증이 필요합니다.\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"접근 권한이 없습니다.\"}");
                })
            )
            .addFilterBefore(
                customFilter,
                UsernamePasswordAuthenticationFilter.class
            )
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .authorizationEndpoint(endpoint -> endpoint
                    .authorizationRequestResolver(
                        new CustomAuthorizationRequestResolver(clientRegistrationRepository)
                    )
                )
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))

                .failureHandler(oAuthFailureHandler)

                .successHandler((request, response, authentication) -> {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    request.getSession().setAttribute("member", authentication.getPrincipal());
                    // response.sendRedirect("/popupClose.html");
                    response.sendRedirect("https://diasec.co.kr/popupClose.html?status=SUCCESS");
                })
            );

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true); // 이 줄 꼭 있어야 합니다!
        config.setAllowedOrigins(List.of(
            "https://diasec.co.kr",
            "https://www.diasec.co.kr",
            "https://pay.nicepay.co.kr"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(Arrays.asList("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}