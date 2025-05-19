# 1단계: React 앱 빌드
FROM node:20 AS build

WORKDIR /app

# package.json, .env 복사
COPY package*.json ./

# COPY .env .env   # 반드시 포함되어야 Vite가 환경변수 인식

# 나머지 소스 복사
COPY . .

RUN npm install && npm run build

# 2단계: NGINX 서버
FROM nginx:stable-alpine

# 빌드된 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# NGINX 설정 복사 (필요할 경우)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
