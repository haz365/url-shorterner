# URL Shortener

A fast URL shortening service built with Node.js, Express and Redis, containerised with Docker Compose.

---

## Overview

Paste a long URL and get a short one back instantly. Shortened URLs are stored in Redis with a 24 hour expiry. Clicking a short URL redirects you to the original. The last 5 shortened URLs are shown in the session history.

---

## Stack

- **Node.js + Express** — web server and API
- **Redis** — stores URL mappings with 24 hour expiry
- **nanoid** — generates unique short URL IDs
- **Docker Compose** — orchestrates the app and Redis containers

---

## Running locally

Make sure Docker Desktop is running, then:

```bash
git clone https://github.com/haz365/url-shortener.git
cd url-shortener
docker-compose up --build
```

Visit `http://localhost:3000`

To stop:
```bash
docker-compose down
```

---

## How it works

1. User pastes a long URL and clicks Shorten
2. The server generates a 6 character unique ID using nanoid
3. The ID and original URL are stored in Redis for 24 hours
4. The short URL is returned and displayed
5. Visiting the short URL triggers a redirect to the original

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves the frontend |
| `/health` | GET | Health check |
| `/shorten` | POST | Creates a shortened URL |
| `/:id` | GET | Redirects to original URL |

**Example request:**
```json
POST /shorten
{ "url": "https://www.google.com/search?q=devops" }
```

**Example response:**
```json
{ "shortUrl": "http://localhost:3000/oTCFra", "id": "oTCFra" }
```

---

## Docker

Two containers managed by Docker Compose:

| Container | Image | Port |
|---|---|---|
| url-shortener | built from Dockerfile | 3000 |
| redis | redis:alpine | 6379 |

Pull and run from Docker Hub:
```bash
docker-compose up
```

Or run just the app image:
```bash
docker run -p 3000:3000 has365/url-shortener:latest
```