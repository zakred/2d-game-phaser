# Build product
FROM node:20-alpine as build
WORKDIR /app
COPY . /app/
RUN npm install
RUN npm run build-prod

# HTTP Server
FROM httpd:2-alpine
COPY --from=build /app/dist /usr/local/apache2/htdocs/
COPY --from=build /app/assets /usr/local/apache2/htdocs/assets/