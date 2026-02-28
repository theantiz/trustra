package xyz.antiz.Trustra.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
	name = "user_trust_scores",
	uniqueConstraints = @UniqueConstraint(name = "uk_user_trust_scores_user_id", columnNames = "user_id")
)
public class TrustScore {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false, length = 100)
	private String userId;

	@Column(nullable = false)
	private Double score;

	@Column(name = "success_rate", nullable = false)
	private Double successRate;

	@Column(name = "dispute_rate", nullable = false)
	private Double disputeRate;

	@Column(name = "average_rating", nullable = false)
	private Double averageRating;

	@Column(name = "last_activity_at")
	private Instant lastActivityAt;

	@Column(name = "calculated_at", nullable = false)
	private Instant calculatedAt;

	@PrePersist
	@PreUpdate
	void updateTimestamp() {
		calculatedAt = Instant.now();
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

	public Double getScore() {
		return score;
	}

	public void setScore(Double score) {
		this.score = score;
	}

	public Double getSuccessRate() {
		return successRate;
	}

	public void setSuccessRate(Double successRate) {
		this.successRate = successRate;
	}

	public Double getDisputeRate() {
		return disputeRate;
	}

	public void setDisputeRate(Double disputeRate) {
		this.disputeRate = disputeRate;
	}

	public Double getAverageRating() {
		return averageRating;
	}

	public void setAverageRating(Double averageRating) {
		this.averageRating = averageRating;
	}

	public Instant getLastActivityAt() {
		return lastActivityAt;
	}

	public void setLastActivityAt(Instant lastActivityAt) {
		this.lastActivityAt = lastActivityAt;
	}

	public Instant getCalculatedAt() {
		return calculatedAt;
	}

	public void setCalculatedAt(Instant calculatedAt) {
		this.calculatedAt = calculatedAt;
	}
}
