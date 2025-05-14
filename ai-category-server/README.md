### 파일 구조 

ai-category-server/
├── app/
│   ├── api.py              # API 라우터
│   ├── main.py             # 서버 실행 (FastAPI 앱 실행 지점)
│   ├── model_loader.py     # 모델/벡터 불러오기
│   ├── predict.py          # 예측 함수 (모델 inference)
│   └── schemas.py          # 요청/응답 Pydantic 모델
├── config/
│   └── .env                # 환경 변수
├── models/
│   ├── model.pkl           # 저장된 학습 모델
│   ├── vectorizer.pkl      # 저장된 벡터라이저
│   └── confusion_matrix.png
├── train/
│   ├── __init__.py
│   ├── data_loader.py      # 학습 데이터 로딩
│   └── train_model.py      # 모델 학습 및 저장
├── README.md
├── requirements.txt
└── run.py                  # 진입점 (main.py 실행 가능)
