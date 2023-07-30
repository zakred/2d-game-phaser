# Game server

# Config

| ENV               | Description                           | Default               |
|-------------------|---------------------------------------|-----------------------|
| SERVER_PORT       | Port of the backend server            | 3000                  |
| CORS_ALLOWED_FQDN | In the server it will allow this FQDN | http://127.0.0.1:8085 |

# Docker

```shell
docker build -t zakred/pi-rats-back .
docker push zakred/pi-rats-back
```
