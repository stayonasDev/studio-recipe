package com.recipe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class FlaskRestClientConfig {

    @Bean
    public RestClient flaskRestClient() {
        // ✅ JDK HttpClient: keep-alive + connection reuse
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(3)); // ✅ 응답 지연/먹통 방지

        return RestClient.builder()
                .baseUrl("http://127.0.0.1:5000")
                .requestFactory(factory)
                .build();
    }
}