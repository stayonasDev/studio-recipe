import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { isScrapped, toggleScrapLocal } from "../lib/scrapStore";
import "./detail.css";

export default function RecipeCard({ recipe, onOpenDetail, onToggleLike }) {
  const id = recipe?.rcpSno;

  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail?.(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpenDetail?.(id);
      }}
    >
      <div className="cardMedia">
        {recipe?.rcpImgUrl ? (
          <img src={recipe.rcpImgUrl} alt={recipe.rcpTtl} loading="lazy" />
        ) : (
          <div className="cardMediaFallback">No Image</div>
        )}
      </div>

      <div className="cardBody">
        <div className="cardTitle">{recipe?.rcpTtl}</div>

        <div className="cardActions">
          <button
            type="button"
            className={`likeBtn ${recipe?.liked ? "active" : ""}`}
            onMouseDown={(e) => {
              // ✅ Link/카드 클릭 먹기 전에 막아야 할 때가 있음
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // ✅ 상세 이동/스크롤 튐 방지
              onToggleLike?.(id, Boolean(recipe?.liked));
            }}
            aria-pressed={Boolean(recipe?.liked)}
          >
            <span className="heart">{recipe?.liked ? "♥" : "♡"}</span>
            <span className="count">{Number(recipe?.rcmmCnt ?? 0)}</span>
          </button>
        </div>
      </div>
    </article>
  );
}