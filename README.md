# Trustra

A trust scoring engine with fraud detection, network influence propagation, and abuse simulation - built with Spring Boot + PostgreSQL + Next.js.

## Overview

Trustra computes dynamic trust scores for users in a peer-to-peer transaction network. Scores are derived from 6 weighted signals, updated on a schedule, and explained per recalculation. An abuse detection layer flags suspicious behavior patterns in real time. A simulation layer lets you trigger malicious scenarios on demand to observe how the scoring system responds.

## Features

### Trust Scoring Engine
- Computes scores from 6 weighted signals:
  - Success rate
  - Dispute rate
  - Feedback rating
  - Network trust influence (counterparty graph)
  - Inactivity decay
  - Abuse penalties
- Scheduled recalculation via Spring `@Scheduled`
- Per-recalculation explanation stored for full auditability
- Score history table with timestamps for time-series tracking

### Abuse Detection
- 3-rule detection system:
  - Transaction spike detection
  - Fake feedback burst detection
  - Cluster behavior detection
- Flags stored and surfaced via API and dashboard

### Simulation
- Endpoints to trigger:
  - Normal activity flow
  - Malicious cluster scenario
  - Transaction spike scenario
- Useful for demos and stress-testing scoring logic

### API
- JWT-secured endpoints (Spring Security)
- OpenAPI / Swagger UI at `/swagger-ui.html`
- Admin endpoints for weight configuration
- Score history endpoint per user

### Dashboard (Next.js 15)
- Search trust score by user ID
- View explanation trail per recalculation
- Score history graph over time
- Create transactions
- Submit feedback
- View abuse flags
- View network trust counterparties
- Trigger simulation flows

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot, Spring Data JPA, Spring Security |
| Database | PostgreSQL |
| API Docs | OpenAPI / Swagger |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Build | Maven, npm |

## Project Structure

```
Trustra/
├── Trustra-backend/
│   ├── src/
│   │   └── main/java/com/antiz/trustra/
│   │       ├── controller/      # REST API endpoints
│   │       ├── service/         # Scoring, abuse, simulation logic
│   │       ├── repository/      # Spring Data JPA repos
│   │       ├── entity/          # JPA entities
│   │       ├── config/          # Security, OpenAPI config
│   │       └── scheduler/       # Scheduled recalculation jobs
│   └── sql/
│       └── local-manual-test-queries.sql
└── frontend/
    ├── app/                     # Next.js App Router pages
    └── components/              # Dashboard UI components
```

## API Reference

### Trust
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/trust/{userId}` | Get current trust score |
| GET | `/api/trust/{userId}/explanation` | Get latest explanation trail |
| GET | `/api/trust/{userId}/history` | Get score history over time |
| POST | `/api/trust/{userId}/recalculate` | Trigger manual recalculation |

### Transactions & Feedback
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions` | Create a transaction |
| POST | `/api/feedback` | Submit feedback |

### Abuse
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/abuse/{userId}/flags` | View abuse flags for user |
| GET | `/api/network/{userId}` | View network counterparties |

### Simulation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/simulate/normal` | Trigger normal activity flow |
| POST | `/api/simulate/malicious-cluster` | Trigger cluster abuse scenario |
| POST | `/api/simulate/spike` | Trigger transaction spike scenario |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/config` | View current scoring weights |
| PUT | `/api/admin/config` | Update scoring weights |

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd Trustra-backend
# configure application.properties with your DB credentials and JWT secret
mvn spring-boot:run
```

Swagger UI available at: `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at: `http://localhost:3000`

### Database

Seed test data using:

```bash
psql -d trustra -f Trustra-backend/sql/local-manual-test-queries.sql
```

## How Scoring Works

Each recalculation computes a weighted sum across 6 signals:

```
trust_score =
  (success_rate        × w1) +
  (1 - dispute_rate)   × w2) +
  (feedback_rating     × w3) +
  (network_influence   × w4) -
  (inactivity_decay    × w5) -
  (abuse_penalty       × w6)
```

Weights are configurable via the admin API without redeployment. Each recalculation stores a human-readable explanation row so you can audit exactly why a score changed.

