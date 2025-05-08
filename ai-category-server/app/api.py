from flask import request, jsonify
from .predict import predict_category

def register_routes(app):
    @app.route("/predict", methods=["POST"])
    def predict():
        data = request.get_json()
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "text가 필요합니다."}), 400

        category = predict_category(text)
        return jsonify({"category": category})
