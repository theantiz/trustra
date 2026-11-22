-- Trustra PostgreSQL Production Schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. User Trust Scores (Latest state)
CREATE TABLE IF NOT EXISTS user_trust_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    success_rate DOUBLE PRECISION NOT NULL,
    dispute_rate DOUBLE PRECISION NOT NULL,
    average_rating DOUBLE PRECISION NOT NULL,
    last_activity_at TIMESTAMPTZ,
    calculated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_user_trust_scores_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_trust_score ON user_trust_scores (score);

-- 2. Trust Score History (Immutable time-series audit trail)
CREATE TABLE IF NOT EXISTS trust_score_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    success_rate DOUBLE PRECISION NOT NULL,
    dispute_rate DOUBLE PRECISION NOT NULL,
    average_rating DOUBLE PRECISION NOT NULL,
    trigger_reason VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_user_recorded ON trust_score_history (user_id, recorded_at DESC);

-- 3. Trust Score Explanations (Explainable AI / Risk Attribution)
CREATE TABLE IF NOT EXISTS trust_score_explanations (
    id BIGSERIAL PRIMARY KEY,
    trust_score_id BIGINT NOT NULL REFERENCES user_trust_scores(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL,
    factor VARCHAR(64) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    contribution DOUBLE PRECISION NOT NULL,
    explanation VARCHAR(500) NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_explanations_user ON trust_score_explanations (user_id);
CREATE INDEX IF NOT EXISTS idx_explanations_trust_score ON trust_score_explanations (trust_score_id);
CREATE INDEX IF NOT EXISTS idx_explanations_user_calc ON trust_score_explanations (user_id, calculated_at DESC);

-- 4. Transactions (Financial Ledger with Idempotency)
CREATE TABLE IF NOT EXISTS trust_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) UNIQUE,
    sender_id VARCHAR(100) NOT NULL,
    receiver_id VARCHAR(100) NOT NULL,
    amount NUMERIC(19, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tx_sender_created ON trust_transactions (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_receiver_created ON trust_transactions (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_idempotency_key ON trust_transactions (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tx_receiver_status ON trust_transactions (receiver_id, status);

-- 5. Feedback
CREATE TABLE IF NOT EXISTS trust_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id VARCHAR(100) NOT NULL,
    to_user_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    type VARCHAR(20) NOT NULL,
    comment VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_to_user ON trust_feedback (to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_to_user_type ON trust_feedback (to_user_id, type);

-- 6. Abuse Flags
CREATE TABLE IF NOT EXISTS abuse_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    flag_type VARCHAR(32) NOT NULL,
    severity VARCHAR(8) NOT NULL,
    details VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_user ON abuse_flags (user_id, created_at DESC);

-- 7. Dynamic Scoring Configuration
CREATE TABLE IF NOT EXISTS scoring_configuration (
    config_key VARCHAR(50) PRIMARY KEY,
    success_weight DOUBLE PRECISION NOT NULL,
    dispute_weight DOUBLE PRECISION NOT NULL,
    feedback_weight DOUBLE PRECISION NOT NULL,
    network_weight DOUBLE PRECISION NOT NULL,
    max_inactivity_penalty DOUBLE PRECISION NOT NULL,
    negative_feedback_penalty DOUBLE PRECISION NOT NULL,
    scam_report_penalty DOUBLE PRECISION NOT NULL,
    spike_penalty DOUBLE PRECISION NOT NULL,
    fake_feedback_penalty DOUBLE PRECISION NOT NULL,
    cluster_penalty DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(100)
);
