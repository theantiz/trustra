package xyz.antiz.Trustra.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "trust_score_explanations")
public class TrustExplanation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false, length = 100)
	private String userId;

	@Column(nullable = false, length = 64)
	private String factor;

	@Column(name = "metric_value", nullable = false)
	private Double metricValue;

	@Column(nullable = false)
	private Double contribution;

	@Column(nullable = false, length = 500)
	private String explanation;

	@Column(name = "calculated_at", nullable = false, updatable = false)
	private Instant calculatedAt;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "trust_score_id", nullable = false)
	private TrustScore trustScore;

	@PrePersist
	void onCreate() {
		if (calculatedAt == null) {
			calculatedAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getFactor() {
		return factor;
	}

	public void setFactor(String factor) {
		this.factor = factor;
	}

	public Double getMetricValue() {
		return metricValue;
	}

	public void setMetricValue(Double metricValue) {
		this.metricValue = metricValue;
	}

	public Double getContribution() {
		return contribution;
	}

	public void setContribution(Double contribution) {
		this.contribution = contribution;
	}

	public String getExplanation() {
		return explanation;
	}

	public void setExplanation(String explanation) {
		this.explanation = explanation;
	}

	public Instant getCalculatedAt() {
		return calculatedAt;
	}

	public void setCalculatedAt(Instant calculatedAt) {
		this.calculatedAt = calculatedAt;
	}

	public TrustScore getTrustScore() {
		return trustScore;
	}

	public void setTrustScore(TrustScore trustScore) {
		this.trustScore = trustScore;
	}
}
