package com.recipe.infra.recommended;

import com.recipe.domain.dto.FlaskRecommendResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class FlaskRecommenderClient {

    private final RestClient restClient = RestClient.create();

    @Value("${recommender.flask-base-url}")
    private String flaskBaseUrl;

    public FlaskRecommendResponse recommend(Long userId, int k, double lambda) {
        String url = UriComponentsBuilder
                .fromHttpUrl(flaskBaseUrl)
                .path("/api/recommend")
                .queryParam("userId", userId)
                .queryParam("k", k)
                .queryParam("lambda", lambda)
                .build()
                .toUriString();

        return restClient.get()
                .uri(url)
                .retrieve()
                .body(FlaskRecommendResponse.class);
    }
}
