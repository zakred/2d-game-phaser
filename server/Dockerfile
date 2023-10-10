# Build product
FROM node:20-alpine
WORKDIR /app
COPY . /app/
RUN npm install && \
    npm run compile
ENTRYPOINT [ "sh", "-c", "npm run start-server" ]