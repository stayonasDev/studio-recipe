package com.recipe.service;

import com.recipe.domain.dto.Recipe.RecipeResponseDTO;
import com.recipe.domain.entity.Recipe;
import com.recipe.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RestClient flaskRestClient;   // ✅ 위 Bean 주입됨
    private final RecipeRepository recipeRepository;

    public List<RecipeResponseDTO> recommendForUser(Long userId, int k, double lambda, Long seedRecipeId) {

        // ✅ Flask 호출 (실패해도 빈 배열 반환)
        Long[] ids;
        try {
            ids = flaskRestClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/api/recommend")
                                .queryParam("userId", userId)
                                .queryParam("k", k)
                                .queryParam("lambda", lambda);
                        if (seedRecipeId != null) {
                            uriBuilder.queryParam("seedRecipeId", seedRecipeId);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(Long[].class);
        } catch (Exception e) {
            return List.of();
        }

        if (ids == null || ids.length == 0) return List.of();

        List<Long> idList = Arrays.asList(ids);

        // ✅ DB에서 조회
        List<Recipe> recipes = recipeRepository.findByRcpSnoIn(idList);
        if (recipes == null || recipes.isEmpty()) return List.of();

        // ✅ 추천 순서 유지
        Map<Long, Recipe> map = recipes.stream()
                .collect(Collectors.toMap(Recipe::getRcpSno, r -> r));

        List<RecipeResponseDTO> result = new ArrayList<>();
        for (Long id : idList) {
            Recipe r = map.get(id);
            if (r != null) result.add(toDto(r));
        }

        return result;
    }

    private RecipeResponseDTO toDto(Recipe r) {
        // ✅ 너 프로젝트 DTO builder 필드에 맞춤
        return RecipeResponseDTO.builder()
                .rcpSno(r.getRcpSno())
                .rcpTtl(r.getRcpTtl())
                .ckgNm(r.getCkgNm())
                .inqCnt(r.getInqCnt())
                .rcmmCnt(r.getRcmmCnt())
                .ckgMthActoNm(r.getCkgMthActoNm())
                .ckgMtrlActoNm(r.getCkgMtrlActoNm())
                .ckgKndActoNm(r.getCkgKndActoNm())
                .ckgMtrlCn(r.getCkgMtrlCn())
                .ckgInbunNm(r.getCkgInbunNm())
                .ckgDodfNm(r.getCkgDodfNm())
                .ckgTimeNm(r.getCkgTimeNm())
                .firstRegDt(r.getFirstRegDt())
                .rcpImgUrl(r.getRcpImgUrl())
                .build();
    }
}