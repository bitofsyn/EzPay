from train.data_loader import load_training_data
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns

# 1. 데이터 불러오기
df = load_training_data()

# 2. 벡터화 및 학습
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df["text"])
y = df["label"]

model = LogisticRegression(max_iter=1000)
model.fit(X, y)

# 3. 예측 및 정확도 출력
y_pred = model.predict(X)
print("\n정확도:", accuracy_score(y, y_pred))
print("\n분류 리포트:\n", classification_report(y, y_pred))

# 4. 혼동 행렬 시각화 (옵션)
cm = confusion_matrix(y, y_pred, labels=model.classes_)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", xticklabels=model.classes_, yticklabels=model.classes_, cmap="Blues")
plt.xlabel("예측값")
plt.ylabel("실제값")
plt.title("🔍 혼동 행렬")
plt.tight_layout()
plt.savefig("models/confusion_matrix.png")
plt.close()

# 5. 모델 저장
os.makedirs("models", exist_ok=True)
joblib.dump(model, os.path.join("models", "model.pkl"))
joblib.dump(vectorizer, os.path.join("models", "vectorizer.pkl"))

print("\n모델 저장 완료!")
