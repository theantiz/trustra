package xyz.antiz.Trustra.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import xyz.antiz.Trustra.entity.Transaction;

public record TransactionResponse(
	UUID id,
	String idempotencyKey,
	String senderId,
	String receiverId,
	BigDecimal amount,
	String currency,
	String status,
	Instant createdAt
) {
	public static TransactionResponse fromEntity(Transaction t) {
		return new TransactionResponse(
			t.getId(),
			t.getIdempotencyKey(),
			t.getSenderId(),
			t.getReceiverId(),
			t.getAmount(),
			t.getCurrency(),
			t.getStatus(),
			t.getCreatedAt()
		);
	}
}
