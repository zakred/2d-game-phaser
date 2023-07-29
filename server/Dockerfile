# Build product
FROM node:20-alpine
WORKDIR /app
COPY . /app/
RUN npm install
ENTRYPOINT [ "sh", "-c", "npm run prod" ]