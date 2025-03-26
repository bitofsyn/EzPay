FROM node:18-alpine AS build
WORKDIR /app

# 1. 의존성 설치를 위한 파일 먼저 복사
COPY package.json .
COPY package-lock.json .

RUN npm install

# 2. 나머지 소스 복사
COPY . .

ENV WATCHPACK_POLLING=true

# 3. 빌드
RUN npm run build

# 4. Nginx로 정적 파일 제공
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
