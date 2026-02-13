FROM python:3.9-slim

WORKDIR /app

# 라이브러리 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스코드 및 CSV 파일 복사
COPY . .

# Flask 서버 실행
CMD ["python", "app.py"]