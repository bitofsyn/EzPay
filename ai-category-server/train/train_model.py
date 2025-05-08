from train.data_loader import load_training_data
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib
import os

# 1. 데이터 불러오기
df = load_training_data()

# 2. 벡터화
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["text"])
y = df["label"]

# 3. 모델 학습
model = LogisticRegression(max_iter=1000)
model.fit(X, y)

# 4. 모델 저장 경로
model_dir = "models"
os.makedirs(model_dir, exist_ok=True)

joblib.dump(model, os.path.join(model_dir, "model.pkl"))
joblib.dump(vectorizer, os.path.join(model_dir, "vectorizer.pkl"))

print(f" 모델 학습 완료. 총 학습 데이터 수: {len(df)}")
