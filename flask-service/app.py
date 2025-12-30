import os
import csv
import redis
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

db = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    decode_responses=True
)

CSV_FILE = os.getenv("CSV_FILE", "recipe_data_241226.csv")
HISTORY_TTL = 60 * 60 * 24 * 7  # 7일
LOADED_FLAG_KEY = "app:recipes_loaded"

# 추천 파라미터
EXPLORATION_RATIO = 0.7  # 70%는 새 레시피 우선
COMMON_COUNT = 10
SPECIAL_COUNT = 2

def check_redis_connection():
    try:
        db.ping()
        print("✅ Redis 연결 성공")
        return True
    except redis.ConnectionError as e:
        print(f"❌ Redis 연결 실패: {e}")
        return False

def load_data_to_redis():
    if db.get(LOADED_FLAG_KEY) == "1":
        print("✅ Redis 데이터 이미 로드됨")
        return

    print("🔄 CSV 데이터 Redis 적재 중...")

    try:
        with open(CSV_FILE, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            pipe = db.pipeline()
            count = 0
            
            for row in reader:
                rcp_id = row.get("RCP_SNO", "").strip()
                title = row.get("RCP_TTL", "").strip()
                if not rcp_id or not title:
                    continue

                pipe.hset(f"recipe:{rcp_id}", mapping={
                    "id": rcp_id,
                    "name": title,
                    "menu_name": row.get("CKG_NM", title),
                    "img": row.get("RCP_IMG_URL", ""),
                    "desc": row.get("CKG_IPDC", "")
                })

                kind = row.get("CKG_KND_ACTO_NM", "")
                situation = row.get("CKG_STA_ACTO_NM", "")

                # 시간대 분류
                if situation in ["야식", "간식", "술안주"]:
                    pipe.sadd("idx:time:latenight:common", rcp_id)
                elif situation in ["일상", "초스피드", "도시락"]:
                    pipe.sadd("idx:time:lunch:common", rcp_id)
                    pipe.sadd("idx:time:breakfast:common", rcp_id)  # 아침도 추가
                elif situation in ["손님접대", "명절"]:
                    pipe.sadd("idx:time:dinner:special", rcp_id)
                elif situation in ["건강식", "다이어트"]:
                    pipe.sadd("idx:time:breakfast:common", rcp_id)
                elif situation in ["브런치"]:
                    pipe.sadd("idx:time:breakfast:special", rcp_id)
                else:
                    pipe.sadd("idx:time:dinner:common", rcp_id)
                    pipe.sadd("idx:time:lunch:common", rcp_id)  # 기본은 점심/저녁

                count += 1
                
                # 배치 실행 (1000개마다)
                if count % 1000 == 0:
                    pipe.execute()
                    pipe = db.pipeline()
                    print(f"   ... {count}개 처리 중")

            pipe.execute()
            db.set(LOADED_FLAG_KEY, "1")
            
        print(f"✅ Redis 적재 완료 (총 {count}개 레시피)")
        
    except FileNotFoundError:
        print(f"❌ CSV 파일을 찾을 수 없습니다: {CSV_FILE}")
        raise
    except Exception as e:
        print(f"❌ CSV 로딩 중 오류: {e}")
        raise

def get_history_key():
    user_id = request.args.get("user_id", "anon").strip()
    return f"user:{user_id}:history:viewed"

def calculate_score(recipe, recipe_id, seen_ids, time_slot):
    """
    랜덤성 기반 추천 + 새 레시피 우대 + 시간대 보너스
    """
    score = 0
    
    # 1️⃣ 기본 랜덤 점수 (매번 다르게 추천)
    score += random.randint(0, 25)
    
    # 2️⃣ 새 레시피 보너스
    if recipe_id not in seen_ids:
        score += 20  # 새 레시피 우대
    
    # 3️⃣ 시간대 보너스
    time_bonus = {
        "아침": 10,
        "점심": 5,
        "저녁": 5,
        "야식": 10
    }
    score += time_bonus.get(time_slot, 0)
    
    return score

def get_recipes_by_ids(recipe_ids):
    """레시피 ID 목록으로 레시피 데이터 조회"""
    recipes = []
    pipe = db.pipeline()
    
    for r_id in recipe_ids:
        pipe.hgetall(f"recipe:{r_id}")
    
    results = pipe.execute()
    
    for r_id, recipe in zip(recipe_ids, results):
        if recipe:
            recipe['id'] = r_id  # ID 보장
            recipes.append((r_id, recipe))
    
    return recipes

@app.route("/api/recommend", methods=["GET"])
def recommend_api():
    try:
        now = datetime.now()
        hour = now.hour

        # 시간대 결정
        if 7 <= hour < 11:
            common_key = "idx:time:breakfast:common"
            special_key = "idx:time:breakfast:special"
            slot_name = "아침"
        elif 11 <= hour < 15:
            common_key = "idx:time:lunch:common"
            special_key = "idx:time:lunch:special"
            slot_name = "점심"
        elif 17 <= hour < 21:
            common_key = "idx:time:dinner:common"
            special_key = "idx:time:dinner:special"
            slot_name = "저녁"
        else:
            common_key = "idx:time:latenight:common"
            special_key = "idx:time:latenight:special"
            slot_name = "야식"

        # 히스토리 조회
        history_key = get_history_key()
        seen_ids = db.smembers(history_key)

        # 후보 풀 샘플링 (충분히 많이)
        sample_size = max(100, COMMON_COUNT * 10)
        common_ids = list(db.srandmember(common_key, sample_size) or [])
        special_ids = list(db.srandmember(special_key, 20) or [])

        # 단일 값이면 리스트로 변환
        if not isinstance(common_ids, list):
            common_ids = [common_ids] if common_ids else []
        if not isinstance(special_ids, list):
            special_ids = [special_ids] if special_ids else []

        # 중복 제거
        common_ids = list(set(common_ids))
        special_ids = list(set(special_ids))

        # 레시피 데이터 조회 및 점수 계산
        scored_common = []
        for r_id, recipe in get_recipes_by_ids(common_ids):
            score = calculate_score(recipe, r_id, seen_ids, slot_name)
            scored_common.append((score, r_id, recipe))

        scored_special = []
        for r_id, recipe in get_recipes_by_ids(special_ids):
            score = calculate_score(recipe, r_id, seen_ids, slot_name)
            scored_special.append((score, r_id, recipe))

        # 점수 높은 순 정렬
        scored_common.sort(key=lambda x: x[0], reverse=True)
        scored_special.sort(key=lambda x: x[0], reverse=True)

        # 최종 선택
        final_items = scored_common[:COMMON_COUNT] + scored_special[:SPECIAL_COUNT]
        
        # 결과 없으면 에러
        if not final_items:
            return jsonify({
                "status": "error",
                "message": f"{slot_name} 시간대에 추천할 레시피가 없습니다.",
                "time_slot": slot_name,
                "count": 0,
                "data": []
            }), 404

        # 최종 셔플 (같은 점수대 레시피 순서 랜덤화)
        random.shuffle(final_items)

        result = []
        viewed_ids = []

        for score, r_id, item in final_items:
            result.append({
                "id": item.get("id"),
                "name": item.get("name"),
                "menu_name": item.get("menu_name"),
                "img": item.get("img"),
                "desc": item.get("desc"),
                "score": round(score, 2),  # 디버깅용
                "is_new": r_id not in seen_ids  # 새 레시피 여부
            })
            viewed_ids.append(r_id)

        # 히스토리 업데이트
        if viewed_ids:
            db.sadd(history_key, *viewed_ids)
            db.expire(history_key, HISTORY_TTL)

        # 통계 정보
        new_count = sum(1 for item in result if item["is_new"])
        
        return jsonify({
            "status": "success",
            "time_slot": slot_name,
            "hour": hour,
            "count": len(result),
            "new_count": new_count,
            "seen_count": len(result) - new_count,
            "data": result
        })
        
    except Exception as e:
        print(f"❌ 추천 API 오류: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/stats", methods=["GET"])
def stats_api():
    """사용자 통계 조회"""
    try:
        history_key = get_history_key()
        seen_count = db.scard(history_key)
        ttl = db.ttl(history_key)
        
        return jsonify({
            "status": "success",
            "viewed_recipes": seen_count,
            "history_expires_in_seconds": ttl if ttl > 0 else 0
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/reset", methods=["POST"])
def reset_history():
    """사용자 히스토리 초기화"""
    try:
        history_key = get_history_key()
        deleted = db.delete(history_key)
        
        return jsonify({
            "status": "success",
            "message": "히스토리가 초기화되었습니다.",
            "deleted": deleted > 0
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/api/health")
def health():
    try:
        db.ping()
        
        # 데이터 로드 상태 확인
        loaded = db.get(LOADED_FLAG_KEY) == "1"
        
        # 샘플 레시피 수 확인
        sample_count = db.scard("idx:time:lunch:common")
        
        return jsonify({
            "status": "healthy",
            "redis_connected": True,
            "data_loaded": loaded,
            "sample_recipe_count": sample_count
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 503

if __name__ == "__main__":
    if not check_redis_connection():
        print("❌ Redis 연결 실패로 서버를 시작할 수 없습니다.")
        exit(1)

    try:
        load_data_to_redis()
    except Exception as e:
        print(f"❌ 데이터 로딩 실패: {e}")
        exit(1)

    print("🚀 Flask 추천 서버 실행 (5001)")
    print(f"   - Exploration 비율: {EXPLORATION_RATIO * 100}%")
    print(f"   - 일반 추천: {COMMON_COUNT}개")
    print(f"   - 특별 추천: {SPECIAL_COUNT}개")
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)