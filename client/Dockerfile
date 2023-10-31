# Build product
FROM node:20-alpine as build
WORKDIR /app
COPY . /app/
RUN npm install
RUN npm run build-prod

# HTTP Server
FROM nginx:1.25
COPY --from=build /app/dist /usr/share/nginx/html/