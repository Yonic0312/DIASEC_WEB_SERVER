# 베이스 이미지 설정
# FROM openjdk:17-jdk-slim
FROM eclipse-temurin:17-jdk-jammy

# 작업 디렉토리 생성
WORKDIR /app

# 빌드된 jar 파일 복사
COPY target/diasec_backend-0.0.1-SNAPSHOT.jar app.jar

# 실행 (wait 적용 db)
COPY wait-for-it.sh .

CMD ["./wait-for-it.sh", "db:3306", "--", "java", "-jar", "app.jar"]

