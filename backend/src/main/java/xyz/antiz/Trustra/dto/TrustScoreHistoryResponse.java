package xyz.antiz.Trustra.dto;

import java.time.Instant;

public record TrustScoreHistoryResponse(
	Long id,
	String userId,
	double score,
	double successRate,
	double disputeRate,
	double averageRating,
	String triggerReason,
	Instant recordedAt
) {
}
