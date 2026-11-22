package xyz.antiz.Trustra.dto;

import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public record ScoringConfigDto(
	@DecimalMin("0.0") @DecimalMax("100.0") double successWeight,
	@DecimalMin("0.0") @DecimalMax("100.0") double disputeWeight,
	@DecimalMin("0.0") @DecimalMax("100.0") double feedbackWeight,
	@DecimalMin("0.0") @DecimalMax("100.0") double networkWeight,
	@DecimalMin("0.0") @DecimalMax("50.0") double maxInactivityPenalty,
	@DecimalMin("0.0") @DecimalMax("20.0") double negativeFeedbackPenalty,
	@DecimalMin("0.0") @DecimalMax("50.0") double scamReportPenalty,
	@DecimalMin("0.0") @DecimalMax("50.0") double spikePenalty,
	@DecimalMin("0.0") @DecimalMax("50.0") double fakeFeedbackPenalty,
	@DecimalMin("0.0") @DecimalMax("50.0") double clusterPenalty,
	Instant updatedAt,
	String updatedBy
) {
	public ScoringConfigDto(
		double successWeight,
		double disputeWeight,
		double feedbackWeight,
		double networkWeight,
		double maxInactivityPenalty,
		double negativeFeedbackPenalty,
		double scamReportPenalty,
		double spikePenalty,
		double fakeFeedbackPenalty,
		double clusterPenalty
	) {
		this(
			successWeight,
			disputeWeight,
			feedbackWeight,
			networkWeight,
			maxInactivityPenalty,
			negativeFeedbackPenalty,
			scamReportPenalty,
			spikePenalty,
			fakeFeedbackPenalty,
			clusterPenalty,
			Instant.now(),
			"admin"
		);
	}
}
