from train.data_loader import load_training_data
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns


# 전체 학습 로직 담당
def train_model():
    df = load_training_data()

    # 벡터화 및 모델 학습
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(df["text"])
    y = df["label"]

    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)

    # 학습 결과 출력
    y_pred = model.predict(X)
    print("\n정확도:", accuracy_score(y, y_pred))
    print("\n분류 리포트:\n", classification_report(y, y_pred))

    return model, vectorizer, y, y_pred, model.classes_

# 학습된 모델 및 벡터 저장
def save_model(model, vectorizer, path="models"):
    os.makedirs(path, exist_ok=True)
    joblib.dump(model, os.path.join(path, "model.pkl"))
    joblib.dump(vectorizer, os.path.join(path, "vectorizer.pkl"))
    print(f"\n모델 저장 완료 → {path}/model.pkl, vectorizer.pkl")


# 결과를 시각화 하여 이미지 저장
def plot_confusion_matrix(y_true, y_pred, labels, save_path="models/confusion_matrix.png"):
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=labels, yticklabels=labels, cmap="Blues")
    plt.xlabel("예측값")
    plt.ylabel("실제값")
    plt.title("혼동 행렬")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"혼동 행렬 저장 완료 → {save_path}")


# 실행 진입점
if __name__ == "__main__":
    model, vectorizer, y_true, y_pred, labels = train_model()
    save_model(model, vectorizer)
    plot_confusion_matrix(y_true, y_pred, labels)
