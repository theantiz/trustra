package xyz.antiz.Trustra.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "abuse_flags")
public class AbuseFlag {

	@Id
	@UuidGenerator
	private UUID id;

	@Column(name = "user_id", nullable = false, length = 100)
	private String userId;

	@Column(name = "flag_type", nullable = false, length = 32)
	private String flagType;

	@Column(nullable = false, length = 8)
	private String severity;

	@Column(nullable = false, length = 500)
	private String details;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getFlagType() {
		return flagType;
	}

	public void setFlagType(String flagType) {
		this.flagType = flagType;
	}

	public String getSeverity() {
		return severity;
	}

	public void setSeverity(String severity) {
		this.severity = severity;
	}

	public String getDetails() {
		return details;
	}

	public void setDetails(String details) {
		this.details = details;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
