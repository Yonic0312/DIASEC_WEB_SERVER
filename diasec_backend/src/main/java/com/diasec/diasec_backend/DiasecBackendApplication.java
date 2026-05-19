package com.diasec.diasec_backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@ComponentScan(basePackages = "com.diasec")
@MapperScan("com.diasec.diasec_backend.dao")
public class DiasecBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiasecBackendApplication.class, args);
	}
}