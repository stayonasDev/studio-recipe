import "./recipeCard.css";

export default function RecipeCard({ recipe, onOpenDetail, onToggleLike }) {
  const {
    rcpSno,
    rcpTtl,
    ckgNm,
    ckgMtrlCn,
    rcpImgUrl,
    liked,
    rcmmCnt,
  } = recipe;

  function open() {
    onOpenDetail?.(rcpSno);
  }

  function onLikeClick(e) {
    // ✅ 메인에서 좋아요 눌렀을 때 detail 열리거나 스크롤 튀는 원인 차단
    e.preventDefault();
    e.stopPropagation();
    onToggleLike?.(rcpSno, Boolean(liked));
  }

  return (
    <article className="card" onClick={open} role="button" tabIndex={0}>
      <div className="cardMedia">
        {rcpImgUrl ? <img src={rcpImgUrl} alt={rcpTtl} loading="lazy" /> : <div className="mediaFallback" />}
      </div>

      <div className="cardBody">
        <div className="cardTitle">{rcpTtl}</div>
        <div className="cardSub">{ckgNm || ""}</div>

        <div className="cardBottom">
          <button
            type="button"               /* ✅ 중요 */
            className={`likePill ${liked ? "active" : ""}`}
            onClick={onLikeClick}
            aria-pressed={Boolean(liked)}
          >
            <span className="heart">{liked ? "♥" : "♡"}</span>
            <span className="cnt">{Number(rcmmCnt ?? 0)}</span>
          </button>

          <button
            type="button"
            className="starBtn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // 스크랩이 있으면 여기서 처리
            }}
            aria-label="스크랩"
          >
            ☆
          </button>
        </div>
      </div>
    </article>
  );
}