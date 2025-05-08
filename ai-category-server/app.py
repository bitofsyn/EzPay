from flask import Flask, request, jsonify
import joblib

# Flask 서버 초기화
app = Flask(__name__)

# 학습된 모델과 벡터 불러오기
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data["text"]  # ex) "엄마 생일 선물 엄마"

    X = vectorizer.transform([text])
    prediction = model.predict(X)[0]

    return jsonify({"category": prediction})


if __name__ == "__main__":
    app.run(port=5001)
