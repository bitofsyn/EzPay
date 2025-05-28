import logging

# 로거 초기화
logger = logging.getLogger("ai-category-server")
logger.setLevel(logging.INFO)

# 콘솔 핸들러
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# 출력 형식 설정
formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

logger.addHandler(console_handler)