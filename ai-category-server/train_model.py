import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# 1. 예시 데이터 구성
data = [
    {"text": "점심값 홍길동", "label": "식비"},
    {"text": "3월 관리비 아파트관리소", "label": "주거"},
    {"text": "버스비 교통카드", "label": "교통"},
    {"text": "엄마 생일 선물 엄마", "label": "가족"},
    {"text": "택시비 김기사", "label": "교통"},
    {"text": "마트 장보기 이마트", "label": "식비"},
    {"text": "월세 납부 원룸", "label": "주거"}
]

df = pd.DataFrame(data)

# 2. 벡터화 (텍스트 → 숫자 벡터)
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["text"])
y = df["label"]

# 3. 모델 학습
model = LogisticRegression()
model.fit(X, y)

# 4. 모델과 벡터 저장
joblib.dump(model, "model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("✅ 모델 학습 및 저장 완료!")
