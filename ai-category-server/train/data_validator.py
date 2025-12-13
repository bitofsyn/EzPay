import pandera as pa
from pandera.typing import Series

# 예상되는 카테고리 레이블 목록 (필요에 따라 확장)
# 실제 애플리케이션에서는 이 목록을 중앙 설정 파일이나 DB에서 관리하는 것이 더 좋음
EXPECTED_CATEGORIES = [
    "식비", "교통", "쇼핑", "주거", "의료", "교육", "경조사", "금융", "기타"
]

class TrainingDataSchema(pa.SchemaModel):
    """
    훈련 데이터프레임의 유효성을 검증하기 위한 스키마
    """
    text: Series[str] = pa.Field(
        description="거래 메모 텍스트. 비어 있으면 안 됨.",
        nullable=False,
        str_length={"min_value": 1}
    )
    label: Series[str] = pa.Field(
        description="거래 카테고리. 정의된 목록에 포함되어야 함.",
        isin=EXPECTED_CATEGORIES
    )

    @pa.dataframe_check
    def check_not_too_many_etc(cls, df):
        """'기타' 카테고리의 비율이 너무 높지 않은지 확인 (예: 50% 미만)"""
        etc_ratio = (df["label"] == "기타").mean()
        return etc_ratio < 0.5

    class Config:
        strict = True  # 스키마에 정의된 컬럼 외에 다른 컬럼이 있으면 실패
        coerce = True  # 데이터 타입을 스키마에 맞게 강제 변환


def validate_data(df):
    """
    데이터프레임을 TrainingDataSchema에 대해 검증합니다.
    
    :param df: 검증할 pandas 데이터프레임
    :return: 검증에 통과하면 True, 실패하면 예외 발생
    """
    try:
        TrainingDataSchema.validate(df, lazy=True)
        return True
    except pa.errors.SchemaErrors as err:
        # 검증 실패 시, 오류 내용을 담아 예외를 다시 발생시킴
        raise ValueError(f"데이터 유효성 검증 실패:\n{err.failure_cases}")
