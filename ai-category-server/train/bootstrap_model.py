"""Build the deterministic fallback classifier bundled with the AI service image."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


TRAINING_EXAMPLES = {
    "식비": [
        "한식당 점심 식사", "배달의민족 저녁 주문", "김밥천국 아침 식사",
        "치킨 배달 결제", "고기집 회식", "분식 떡볶이 주문",
    ],
    "카페/간식": [
        "스타벅스 아메리카노", "카페라떼 커피", "베이커리 빵 간식",
        "아이스크림 디저트", "편의점 과자", "카페 케이크 결제",
    ],
    "교통": [
        "지하철 교통카드", "버스 요금", "카카오택시 결제",
        "주유소 휘발유", "고속도로 통행료", "철도 기차표",
    ],
    "여행/숙박": [
        "호텔 숙박 예약", "항공권 결제", "제주도 여행 경비",
        "리조트 예약", "게스트하우스 숙박", "여행사 패키지 결제",
    ],
    "쇼핑": [
        "온라인 쇼핑몰 주문", "백화점 의류 구매", "쿠팡 생활용품",
        "전자제품 구매", "신발 매장 결제", "마트 장보기",
    ],
    "문화/여가": [
        "영화관 티켓", "콘서트 공연 예매", "게임 아이템 결제",
        "볼링장 이용", "도서관 문화 강좌", "취미 공방 결제",
    ],
    "의료/건강": [
        "병원 진료비", "약국 처방약", "치과 치료비",
        "헬스장 이용권", "건강검진 비용", "안과 진료",
    ],
    "교육": [
        "영어 학원 수강료", "온라인 강의 결제", "서점 교재 구매",
        "대학교 등록금", "자격증 시험 응시료", "독서실 이용료",
    ],
    "공과금/통신": [
        "전기 요금 납부", "도시가스 요금", "수도 요금",
        "휴대폰 통신비", "인터넷 요금", "관리 공과금 납부",
    ],
    "주거": [
        "월세 이체", "아파트 관리비", "부동산 중개 수수료",
        "전세 보증금", "주택 수리비", "원룸 임대료",
    ],
    "보험": [
        "자동차 보험료", "실손 보험 납부", "생명보험 월납",
        "화재보험 결제", "여행자 보험", "건강보험 납부",
    ],
    "투자/저축": [
        "정기 적금 이체", "주식 투자 입금", "증권 계좌 예수금",
        "펀드 매수", "예금 신규 가입", "연금 저축 납입",
    ],
    "수입": [
        "회사 급여 입금", "월급 수령", "세금 환급 입금",
        "아르바이트 급여", "상여금 입금", "판매 대금 수입",
    ],
    "이체/송금": [
        "친구에게 송금", "가족 계좌 이체", "개인 간 이체",
        "회비 송금", "용돈 보내기", "정산 금액 이체",
    ],
    "수수료": [
        "은행 이체 수수료", "카드 해외 결제 수수료", "ATM 출금 수수료",
        "환전 수수료", "증권 거래 수수료", "플랫폼 이용 수수료",
    ],
    "기타": [
        "분류되지 않은 결제", "사용처 미상", "기타 지출",
        "알 수 없는 거래", "임시 결제", "메모 없는 거래",
    ],
}


def build_model(output_dir: Path) -> tuple[Path, Path]:
    texts: list[str] = []
    labels: list[str] = []
    for label, examples in TRAINING_EXAMPLES.items():
        texts.extend(examples)
        labels.extend([label] * len(examples))

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        min_df=1,
        sublinear_tf=True,
    )
    features = vectorizer.fit_transform(texts)
    model = LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42,
        C=50.0,
    )
    model.fit(features, labels)

    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / "model.pkl"
    vectorizer_path = output_dir / "vectorizer.pkl"
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    return model_path, vectorizer_path


def verify_model(model_path: Path, vectorizer_path: Path) -> None:
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    checks = {
        "지하철 교통비": "교통",
        "스타벅스 커피": "카페/간식",
        "회사 월급 입금": "수입",
        "친구에게 송금": "이체/송금",
    }
    for text, expected in checks.items():
        features = vectorizer.transform([text])
        actual = model.predict(features)[0]
        if actual != expected:
            raise RuntimeError(f"bootstrap model verification failed: {text} -> {actual}")
        confidence = float(max(model.predict_proba(features)[0]))
        if confidence < 0.4:
            raise RuntimeError(
                f"bootstrap model confidence too low: {text} -> {confidence:.3f}"
            )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("models"))
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    model_path, vectorizer_path = build_model(args.output_dir)
    if args.verify:
        verify_model(model_path, vectorizer_path)
    print(f"bootstrap model written to {model_path} and {vectorizer_path}")


if __name__ == "__main__":
    main()
