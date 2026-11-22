package xyz.antiz.Trustra.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(
	name = "trust_score_history",
	indexes = {
		@Index(name = "idx_history_user_recorded", columnList = "user_id, recorded_at")
	}
)
public class TrustScoreHistory {

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

	@Column(name = "trigger_reason", nullable = false, length = 50)
	private String triggerReason;

	@Column(name = "recorded_at", nullable = false, updatable = false)
	private Instant recordedAt;

	@PrePersist
	void onCreate() {
		if (recordedAt == null) {
			recordedAt = Instant.now();
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

	public String getTriggerReason() {
		return triggerReason;
	}

	public void setTriggerReason(String triggerReason) {
		this.triggerReason = triggerReason;
	}

	public Instant getRecordedAt() {
		return recordedAt;
	}

	public void setRecordedAt(Instant recordedAt) {
		this.recordedAt = recordedAt;
	}
}
