# Trustra

Trustra is a trust scoring demo platform with:

- a Spring Boot backend for trust computation, abuse detection, network scoring, simulation, and explanations
- a Next.js frontend dashboard for checking trust by user ID and triggering demo flows

## Repo Structure

- `Trustra-backend/` Spring Boot API
- `frontend/` Next.js dashboard
- `Trustra-backend/sql/local-manual-test-queries.sql` manual PostgreSQL test data helpers

## Stack

- Backend: Spring Boot, Spring Data JPA, PostgreSQL
- Frontend: Next.js 15, React 19, Tailwind CSS
- Build tools: Maven, npm

## Backend Features

- Trust score calculation from:
  - success rate
  - dispute rate
  - feedback rating
  - network trust influence
  - inactivity decay
  - abuse penalties
- Abuse detection rules:
  - transaction spike
  - fake feedback burst
  - cluster behavior
- Trust explanations stored per recalculation
- Simulation endpoints for normal activity, malicious clusters, and spikes
- Scheduled trust recalculation

## Frontend Features

- Search trust score by user ID
- View explanation trail
- Create transactions
- Submit feedback
- View abuse flags
- View network trust counterparties
- Run simulation flows
