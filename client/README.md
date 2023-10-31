# Game client

# Config

| ENV          | Description                                                  | Default               |
| ------------ | ------------------------------------------------------------ | --------------------- |
| BACKEND_FQDN | Set in the web, the backend FQDN, set this in webpack config | http://localhost:3000 |

# Docker

```shell
docker build -t zakred/pi-rats-front .
docker push zakred/pi-rats-front
```

# To run locally

This project handles Font and Bakend so to run it locally you'd just need to:

```
npm install
npm run start
npm run server
```
