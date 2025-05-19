# 1단계: React 빌드
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
COPY .env .env
COPY . .

RUN npm install && npm run build

# 2단계: NGINX로 정적 파일 서빙
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# NGINX 설정 복사
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
