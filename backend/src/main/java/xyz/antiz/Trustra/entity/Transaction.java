package xyz.antiz.Trustra.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
	name = "trust_transactions",
	indexes = {
		@Index(name = "idx_tx_sender_created", columnList = "sender_id, created_at"),
		@Index(name = "idx_tx_receiver_created", columnList = "receiver_id, created_at"),
		@Index(name = "idx_tx_idempotency_key", columnList = "idempotency_key")
	}
)
public class Transaction {

	@Id
	@UuidGenerator
	private UUID id;

	@Column(name = "idempotency_key", length = 128, unique = true)
	private String idempotencyKey;

	@Column(name = "sender_id", nullable = false, length = 100)
	private String senderId;

	@Column(name = "receiver_id", nullable = false, length = 100)
	private String receiverId;

	@Column(nullable = false, precision = 19, scale = 2)
	private BigDecimal amount = BigDecimal.ZERO;

	@Column(nullable = false, length = 3)
	private String currency = "USD";

	@Column(nullable = false, length = 20)
	private String status = TransactionStatus.SUCCESS.name();

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (currency == null || currency.isBlank()) {
			currency = "USD";
		}
		if (status == null || status.isBlank()) {
			status = TransactionStatus.SUCCESS.name();
		}
	}

	public UUID getId() {
		return id;
	}

	public void setId(UUID id) {
		this.id = id;
	}

	public String getIdempotencyKey() {
		return idempotencyKey;
	}

	public void setIdempotencyKey(String idempotencyKey) {
		this.idempotencyKey = idempotencyKey;
	}

	public String getSenderId() {
		return senderId;
	}

	public void setSenderId(String senderId) {
		this.senderId = senderId;
	}

	public String getReceiverId() {
		return receiverId;
	}

	public void setReceiverId(String receiverId) {
		this.receiverId = receiverId;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getCurrency() {
		return currency;
	}

	public void setCurrency(String currency) {
		this.currency = currency;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
}
