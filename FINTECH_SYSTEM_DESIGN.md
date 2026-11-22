# Trustra: Fintech System Design & Architecture Specification

## 1. Executive Summary

**Trustra** is a high-throughput, institutional-grade trust and risk scoring engine designed for peer-to-peer payment networks, marketplaces, and fintech platforms. It continuously evaluates counterparty reliability, detects fraud and abusive behavior patterns in real time, propagates network trust influence across counterparty transaction graphs, and records an immutable time-series audit trail with full mathematical explainability.

---

## 2. Core Architectural Pillars

### 2.1 Financial Transaction Integrity & Idempotency
In fintech payment networks (similar to Stripe or Square), network partitions and retry loops pose severe risks of duplicate debiting or duplicate ledger entries.
- **Idempotency Guarantee**: Trustra implements idempotency semantics via the `Idempotency-Key` HTTP header and transaction payload field.
- **Conflict Resolution**: Repeated requests with the identical key return the original transaction record instantly without triggering re-execution. If a client attempts to reuse an idempotency key with conflicting payment attributes (amount, currency, sender, or receiver), the system rejects the transaction with an RFC 7807 `409 Conflict` (`DUPLICATE_IDEMPOTENCY_KEY`).
- **Precision**: Monetary amounts are stored strictly using arbitrary-precision `BigDecimal` (`NUMERIC(19, 2)`) with non-negative constraints.

### 2.2 Explainable AI (XAI) & Regulatory Compliance (Adverse Action)
Financial regulations (e.g., Fair Credit Reporting Act, Equal Credit Opportunity Act, EU AI Act) mandate that automated trust scoring and credit/risk gating must be explainable. Users flagged or penalized must have clear risk factors:
- For every score computation, Trustra decomposes the final score into distinct factor contributions stored in `trust_score_explanations`.
- Each factor records the raw metric value (e.g. 96.0% success rate), its net contribution (+48.0 points), and a human-readable justification.
- Historical scores are preserved in an append-only time-series ledger (`trust_score_history`) enabling retroactive auditing: *"What was user X's risk profile when transaction Y was cleared on date Z?"*

### 2.3 Graph Network Influence Propagation
Fraud in digital financial systems rarely occurs in isolation; bad actors establish collusion networks (sybil clusters) to artificially inflate feedback and reputation.
- Trustra maps the counterparty graph using recent transaction topology.
- A user's counterparty score is weighted by the reputation of the entities they trade with:
$$\text{Network Score} = \text{clamp}_{[0, 1]}\left(\frac{1}{N}\sum_{i=1}^{N} \text{Score}(Counterparty_i)\right)$$
$$\text{Network Impact} = (\text{Network Score} - 0.5) \times W_{network}$$
- Trading with verified, reputable counterparties yields positive score elasticity, whereas interacting with low-reputation entities depresses the score.

### 2.4 Abuse Detection & Fraud Heuristics
Trustra executes 3 real-time heuristic fraud detection rules:
1. **Transaction Velocity Spikes (`SPIKE`)**: Compares 24-hour transaction frequency against the 30-day moving average ($\text{Threshold} = \max(10, 5 \times \text{AvgDaily})$). Prevents sudden account takeover (ATO) cash-outs.
2. **Review Velocity Anomalies (`FAKE_FEEDBACK`)**: Detects bursts of ratings within short windows (> 15 feedback submissions in 24 hours), flagging reputation farming.
3. **Sybil Ring / Collusion Detection (`CLUSTER`)**: Detects high-frequency circular trading patterns ($\ge 20$ transactions among $\le 2$ unique counterparties).

---

## 3. Mathematical Scoring Engine

The trust score $\mathcal{S} \in [0, 100]$ is computed as:

$$\mathcal{S} = \text{clamp}_{[0, 100]}\left( \mathcal{B}_{score} + \mathcal{N}_{impact} - \mathcal{P}_{abuse} - \mathcal{P}_{inactivity} \right)$$

Where:
- **Behavioral Base Score**:
$$\mathcal{B}_{score} = \left(\frac{\text{Success Rate}}{100} \cdot W_{success}\right) + \left(\frac{100 - \text{Dispute Rate}}{100} \cdot W_{dispute}\right) + \left(\frac{\text{Rating}}{5.0} \cdot W_{feedback}\right) - (N_{neg} \cdot P_{neg}) - (N_{scam} \cdot P_{scam})$$
- **Network Impact**:
$$\mathcal{N}_{impact} = \left(\frac{\bar{\mathcal{S}}_{partners}}{100} - 0.5\right) \cdot W_{network}$$
- **Abuse Penalty**:
$$\mathcal{P}_{abuse} = \sum_{f \in \text{Flags}} \text{Penalty}(f)$$
- **Inactivity Decay**:
$$\mathcal{P}_{inactivity} = \min\left(P_{max\_decay}, \frac{\text{Days Inactive}}{10}\right) \quad \text{for Days} > 30$$

All weights and penalty multipliers are dynamically managed via the `ScoringConfigService` and `/api/admin/config` without system redeployment.

---

## 4. Scaling Architecture for Enterprise Scale (10M+ Users)

```
       +--------------------------------------------------------+
       |                      Client Apps                       |
       +--------------------------------------------------------+
                                   | (HTTPS / TLS 1.3)
                                   v
       +--------------------------------------------------------+
       |               API Gateway / Rate Limiter               |
       |             (Correlation ID, Auth Verification)        |
       +--------------------------------------------------------+
                                   |
                   +---------------+---------------+
                   |                               |
                   v                               v
    +------------------------------+  +--------------------------+
    |   Trustra Ingestion API      |  |   Trust Query Service    |
    | (Transactions / Feedback)    |  |   (P99 < 15ms Cache)     |
    +------------------------------+  +--------------------------+
                   |                               |
                   v                               v
    +------------------------------+  +--------------------------+
    |   Kafka Transaction Topic    |  |     Redis Read Cache     |
    +------------------------------+  +--------------------------+
                   |                               ^
                   v                               |
    +------------------------------+               |
    |  Real-Time Flink/Spark Risk  |---------------+ (Cache Invalidation)
    |  Scoring & Fraud Detection   |
    +------------------------------+
                   |
                   v
    +------------------------------+
    | PostgreSQL Multi-AZ Cluster  |
    | (Partitioned History Table)  |
    +------------------------------+
```

### 4.1 High-Throughput Write Path
- Ingestion endpoints emit events to Kafka partitions keyed by `userId`.
- Database write operations leverage PostgreSQL connection pooling with HikariCP.
- Tables (`trust_transactions`, `trust_score_history`) are indexed on `(user_id, created_at DESC)` and ready for declarative time-range partitioning (`PARTITION BY RANGE (created_at)`).

### 4.2 Low-Latency Read Path
- Trust scores are cached in memory / Redis with read latencies $< 5\text{ms}$.
- Recalculation runs asynchronously on transactional triggers or batch jobs, invalidating the user cache and recording delta explanations.

---

## 5. Security & Compliance Architecture

- **Stateless Authentication**: JWT bearer tokens signed with HMAC-SHA256 (`jjwt-api`).
- **Role-Based Access Control**:
  - `ROLE_ADMIN`: Administrative endpoints (`/api/admin/**`) for weight re-tuning.
  - `ROLE_USER`: Transaction creation and user profile queries.
  - Public endpoints: Swagger UI, Actuator health checks, and simulation controls.
- **Traceability**: `CorrelationIdFilter` assigns or propagates `X-Correlation-ID` across HTTP headers and SLF4J / Logback MDC context for distributed tracing.
- **OWASP Hardening**:
  - Parameterized JPA queries prevent SQL injection.
  - CORS policies restrict allowed origins.
  - Frame options restricted to prevent Clickjacking.
