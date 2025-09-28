# Docker Compose Application

This project contains a Docker Compose setup for running a Node.js Express backend service.

## Project Structure

```
.
├── docker-compose.yml
├── postgres-init/
│   └── 01_init.sql
├── user-service/
│   ├── src/
│   │   ├── db/
│   │   │   └── pool.js
│   │   └── index.js
│   ├── .env
│   ├── .dockerignore
│   ├── Dockerfile
│   └── package.json
└── README.md
```

## Services

### User Service

A Node.js Express backend service that provides user-related APIs.

- Port: 3000
- Endpoints:
  - `GET /`: Welcome message
  - `GET /api/users`: Returns a list of users from PostgreSQL
  - `GET /health`: App and DB health check

Uses a PostgreSQL connection pool (`pg.Pool`) to avoid blocking the event loop and to reuse connections efficiently.

### db-user (PostgreSQL)

An official PostgreSQL image with an initialization script to create the `users` table and seed data.

- Port: 5432
- Database: `db-user`
- Username: `user-service-db`
- Password: `user@!4`
- Initialization scripts: `postgres-init/` mounted to `/docker-entrypoint-initdb.d`

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running the Application

1. Clone this repository
2. Navigate to the project directory
3. Run the following command to start all services:

```bash
docker-compose up
```

To run in detached mode:

```bash
docker-compose up -d
```

### Stopping the Application

```bash
docker-compose down

- The `user-service` uses an async `pg` connection pool (`src/db/pool.js`) to avoid event loop blocking.
- Queries are awaited with `async/await` and errors are handled without crashing the process.
- A graceful shutdown handler closes the HTTP server and the PG pool on `SIGINT`/`SIGTERM`.
- `depends_on` with healthcheck ensures `user-service` waits for `db-user` readiness.
