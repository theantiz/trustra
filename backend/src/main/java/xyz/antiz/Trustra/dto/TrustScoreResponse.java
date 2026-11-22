package xyz.antiz.Trustra.dto;

import java.time.Instant;
import xyz.antiz.Trustra.entity.TrustScore;

public record TrustScoreResponse(
	Long id,
	String userId,
	double score,
	String trustLevel,
	double successRate,
	double disputeRate,
	double averageRating,
	Instant calculatedAt,
	Instant lastActivityAt
) {
	public static String determineTrustLevel(double score) {
		if (score >= 75.0) {
			return "HIGH";
		}
		if (score >= 45.0) {
			return "MEDIUM";
		}
		return "LOW";
	}

	public static TrustScoreResponse fromEntity(TrustScore ts) {
		double score = ts.getScore() != null ? ts.getScore() : 50.0;
		return new TrustScoreResponse(
			ts.getId(),
			ts.getUserId(),
			score,
			determineTrustLevel(score),
			ts.getSuccessRate() != null ? ts.getSuccessRate() : 0.0,
			ts.getDisputeRate() != null ? ts.getDisputeRate() : 0.0,
			ts.getAverageRating() != null ? ts.getAverageRating() : 0.0,
			ts.getCalculatedAt(),
			ts.getLastActivityAt()
		);
	}
}
