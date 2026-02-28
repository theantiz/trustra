package xyz.antiz.Trustra.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.entity.TrustExplanation;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustExplanationRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;

@Service
@Transactional(readOnly = true)
public class TrustEngineService {

	private static final double SUCCESS_WEIGHT = 50.0;
	private static final double DISPUTE_WEIGHT = 30.0;
	private static final double FEEDBACK_WEIGHT = 20.0;
	private static final double MAX_FEEDBACK_RATING = 5.0;
	private static final double MAX_INACTIVITY_PENALTY = 20.0;
	private static final double NEGATIVE_FEEDBACK_PENALTY = 2.0;
	private static final double SCAM_REPORT_PENALTY = 5.0;

	private final TransactionRepo transactionRepo;
	private final FeedbackRepo feedbackRepo;
	private final TrustScoreRepo trustScoreRepo;
	private final TrustExplanationRepo trustExplanationRepo;
	private final AbuseDetectionService abuseDetectionService;
	private final AbuseFlagRepo abuseFlagRepo;

	public TrustEngineService(
		TransactionRepo transactionRepo,
		FeedbackRepo feedbackRepo,
		TrustScoreRepo trustScoreRepo,
		TrustExplanationRepo trustExplanationRepo,
		AbuseDetectionService abuseDetectionService,
		AbuseFlagRepo abuseFlagRepo
	) {
		this.transactionRepo = transactionRepo;
		this.feedbackRepo = feedbackRepo;
		this.trustScoreRepo = trustScoreRepo;
		this.trustExplanationRepo = trustExplanationRepo;
		this.abuseDetectionService = abuseDetectionService;
		this.abuseFlagRepo = abuseFlagRepo;
	}

	public TrustScore get(String userId) {
		return trustScoreRepo.findByUserId(userId).orElseGet(() -> recalculate(userId));
	}

	public List<TrustExplanationView> getExplanations(String userId) {
		return trustExplanationRepo.findByUserIdOrderByCalculatedAtDescIdDesc(userId).stream()
			.map(explanation -> new TrustExplanationView(
				explanation.getFactor(),
				round(defaultDouble(explanation.getMetricValue())),
				round(defaultDouble(explanation.getContribution())),
				explanation.getExplanation(),
				explanation.getCalculatedAt()
			))
			.toList();
	}

	@Transactional
	public void touchActivity(String userId, Instant activityAt) {
		TrustScore trustScore = trustScoreRepo.findByUserId(userId).orElseGet(TrustScore::new);
		trustScore.setUserId(userId);
		trustScore.setScore(defaultDouble(trustScore.getScore()));
		trustScore.setSuccessRate(defaultDouble(trustScore.getSuccessRate()));
		trustScore.setDisputeRate(defaultDouble(trustScore.getDisputeRate()));
		trustScore.setAverageRating(defaultDouble(trustScore.getAverageRating()));
		if (trustScore.getLastActivityAt() == null || activityAt.isAfter(trustScore.getLastActivityAt())) {
			trustScore.setLastActivityAt(activityAt);
		}
		trustScoreRepo.save(trustScore);
	}

	@Transactional
	public List<TrustScore> recalculateAll() {
		return trustScoreRepo.findAll().stream()
			.map(trustScore -> recalculate(trustScore.getUserId()))
			.toList();
	}

	@Transactional
	public TrustScore recalculate(String userId) {
		long totalTransactions = transactionRepo.countByReceiverId(userId);
		long successfulTransactions = transactionRepo.countByReceiverIdAndStatus(userId, "SUCCESS");
		long disputedTransactions = transactionRepo.countByReceiverIdAndStatus(userId, "DISPUTE");
		long totalFeedback = feedbackRepo.countByToUserId(userId);
		double calculatedAverageRating = totalFeedback == 0 ? 0.0 : feedbackRepo.averageRatingByToUserId(userId);
		long negativeFeedbackCount = feedbackRepo.countByToUserIdAndType(userId, "NEGATIVE");
		long scamReportCount = feedbackRepo.countByToUserIdAndType(userId, "SCAM_REPORT");

		TrustScore trustScore = trustScoreRepo.findByUserId(userId).orElseGet(TrustScore::new);
		trustScore.setUserId(userId);
		double existingScore = defaultDouble(trustScore.getScore());
		double existingSuccessRate = defaultDouble(trustScore.getSuccessRate());
		double existingDisputeRate = defaultDouble(trustScore.getDisputeRate());
		double existingAverageRating = defaultDouble(trustScore.getAverageRating());

		List<AbuseFlag> abuseFlags = abuseDetectionService.detect(userId);
		boolean preserveBaseline = shouldPreserveBaseline(trustScore, totalTransactions, totalFeedback, abuseFlags);

		double successRate = preserveBaseline
			? existingSuccessRate
			: (totalTransactions == 0 ? 0.0 : ((double) successfulTransactions / totalTransactions) * 100.0);
		double disputeRate = preserveBaseline
			? existingDisputeRate
			: (totalTransactions == 0 ? 0.0 : ((double) disputedTransactions / totalTransactions) * 100.0);
		double averageRating = preserveBaseline ? existingAverageRating : calculatedAverageRating;

		double successContribution = totalTransactions == 0 ? 0.0 : (successRate / 100.0) * SUCCESS_WEIGHT;
		double disputeContribution = totalTransactions == 0 ? 0.0 : ((100.0 - disputeRate) / 100.0) * DISPUTE_WEIGHT;
		double feedbackContribution = totalFeedback == 0 ? 0.0 : (averageRating / MAX_FEEDBACK_RATING) * FEEDBACK_WEIGHT;
		double negativeFeedbackPenalty = negativeFeedbackCount * NEGATIVE_FEEDBACK_PENALTY;
		double scamReportPenalty = scamReportCount * SCAM_REPORT_PENALTY;
		double behavioralScore = preserveBaseline
			? existingScore
			: successContribution + disputeContribution + feedbackContribution - negativeFeedbackPenalty - scamReportPenalty;
		NetworkTrustSnapshot networkTrustSnapshot = buildNetworkTrustSnapshot(userId);
		double networkImpact = preserveBaseline ? 0.0 : networkTrustSnapshot.impact();

		trustScore.setSuccessRate(round(successRate));
		trustScore.setDisputeRate(round(disputeRate));
		trustScore.setAverageRating(round(averageRating));

		long inactivityDays = 0;
		double inactivityPenalty = 0.0;
		Instant lastActivityAt = trustScore.getLastActivityAt();
		if (lastActivityAt != null) {
			inactivityDays = Math.max(0, ChronoUnit.DAYS.between(lastActivityAt, Instant.now()));
			if (inactivityDays > 30) {
				inactivityPenalty = Math.min(MAX_INACTIVITY_PENALTY, inactivityDays / 10.0);
			}
		}

		double totalPenalty = abuseFlags.stream().mapToDouble(this::penaltyFor).sum();
		double finalScore = behavioralScore + networkImpact - totalPenalty - inactivityPenalty;
		trustScore.setScore(round(clamp(finalScore)));

		TrustScore savedTrustScore = trustScoreRepo.save(trustScore);
		trustExplanationRepo.deleteByUserId(userId);
		abuseFlagRepo.deleteByUserId(userId);
		if (!abuseFlags.isEmpty()) {
			abuseFlagRepo.saveAll(abuseFlags);
		}

		List<TrustExplanation> explanations = new ArrayList<>();
		if (preserveBaseline) {
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"BASELINE_SCORE",
					round(existingScore),
					round(existingScore),
					"Baseline demo trust retained until enough real activity exists for recalculation."
				)
			);
		} else {
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"SUCCESS_RATE",
					round(successRate),
					round(successContribution),
					String.format(
						"Successful transactions: %d of %d. Higher success rates increase trust.",
						successfulTransactions,
						totalTransactions
					)
				)
			);
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"DISPUTE_RATE",
					round(disputeRate),
					round(disputeContribution),
					String.format(
						"Disputed transactions: %d of %d. Lower dispute rates preserve more trust points.",
						disputedTransactions,
						totalTransactions
					)
				)
			);
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"FEEDBACK_RATING",
					round(averageRating),
					round(feedbackContribution),
					String.format(
						"Average feedback rating is %.2f out of %.0f based on %d feedback entries.",
						averageRating,
						MAX_FEEDBACK_RATING,
						totalFeedback
					)
				)
			);
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"NETWORK_TRUST",
					round(networkTrustSnapshot.averagePartnerScore()),
					round(networkImpact),
					String.format(
						"Network trust influence: Avg partner score %.2f across %d counterparties.",
						networkTrustSnapshot.averagePartnerScore(),
						networkTrustSnapshot.counterparties().size()
					)
				)
			);
		}
		for (AbuseFlag abuseFlag : abuseFlags) {
			double penalty = penaltyFor(abuseFlag);
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"ABUSE_" + abuseFlag.getFlagType(),
					1.0,
					round(-penalty),
					String.format(
						"%s abuse flag (%s severity): %s",
						abuseFlag.getFlagType(),
						abuseFlag.getSeverity(),
						abuseFlag.getDetails()
					)
				)
			);
		}
		if (lastActivityAt != null) {
			explanations.add(
				buildExplanation(
					savedTrustScore,
					userId,
					"INACTIVITY_DECAY",
					(double) inactivityDays,
					round(-inactivityPenalty),
					String.format("Inactivity penalty: %d days inactive.", inactivityDays)
				)
			);
		}

		trustExplanationRepo.saveAll(explanations);
		return savedTrustScore;
	}

	public double calculateNetworkScore(String userId) {
		return buildNetworkTrustSnapshot(userId).networkScore();
	}

	public List<NetworkCounterpartyView> getNetworkView(String userId) {
		return buildNetworkTrustSnapshot(userId).counterparties();
	}

	private boolean shouldPreserveBaseline(
		TrustScore trustScore,
		long totalTransactions,
		long totalFeedback,
		List<AbuseFlag> abuseFlags
	) {
		return trustScore.getId() != null
			&& totalTransactions == 0
			&& totalFeedback == 0
			&& abuseFlags.isEmpty()
			&& trustScore.getScore() != null;
	}

	private NetworkTrustSnapshot buildNetworkTrustSnapshot(String userId) {
		List<Transaction> recentTransactions = transactionRepo.findTop100BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
		if (recentTransactions.isEmpty()) {
			return new NetworkTrustSnapshot(0.5, 50.0, 0.0, List.of());
		}

		Set<String> uniqueCounterparties = new LinkedHashSet<>();
		for (Transaction transaction : recentTransactions) {
			String counterparty = userId.equals(transaction.getSenderId())
				? transaction.getReceiverId()
				: transaction.getSenderId();
			if (counterparty != null && !counterparty.equals(userId)) {
				uniqueCounterparties.add(counterparty);
			}
		}

		if (uniqueCounterparties.isEmpty()) {
			return new NetworkTrustSnapshot(0.5, 50.0, 0.0, List.of());
		}

		List<TrustScore> counterpartyScores = trustScoreRepo.findByUserIdIn(uniqueCounterparties);
		Map<String, Double> scoreByUserId = new HashMap<>();
		for (TrustScore trustScore : counterpartyScores) {
			scoreByUserId.put(trustScore.getUserId(), trustScore.getScore() == null ? 50.0 : trustScore.getScore());
		}

		List<NetworkCounterpartyView> counterparties = new ArrayList<>();
		double totalScore = 0.0;
		for (String counterparty : uniqueCounterparties) {
			double score = scoreByUserId.getOrDefault(counterparty, 50.0);
			counterparties.add(new NetworkCounterpartyView(counterparty, round(score)));
			totalScore += score;
		}

		double averagePartnerScore = totalScore / counterparties.size();
		double networkScore = clamp01(averagePartnerScore / 100.0);
		double impact = round((networkScore - 0.5) * 30.0);
		return new NetworkTrustSnapshot(networkScore, round(averagePartnerScore), impact, counterparties);
	}

	private double penaltyFor(AbuseFlag abuseFlag) {
		return switch (abuseFlag.getFlagType()) {
			case "SPIKE" -> 8.0;
			case "FAKE_FEEDBACK" -> 12.0;
			case "CLUSTER" -> 15.0;
			default -> 0.0;
		};
	}

	private TrustExplanation buildExplanation(
		TrustScore trustScore,
		String userId,
		String factor,
		double metricValue,
		double contribution,
		String explanation
	) {
		TrustExplanation trustExplanation = new TrustExplanation();
		trustExplanation.setTrustScore(trustScore);
		trustExplanation.setUserId(userId);
		trustExplanation.setFactor(factor);
		trustExplanation.setMetricValue(metricValue);
		trustExplanation.setContribution(contribution);
		trustExplanation.setExplanation(explanation);
		return trustExplanation;
	}

	private double clamp(double score) {
		return Math.max(0.0, Math.min(100.0, score));
	}

	private double clamp01(double score) {
		return Math.max(0.0, Math.min(1.0, score));
	}

	private double defaultDouble(Double value) {
		return value == null ? 0.0 : value;
	}

	private double round(double value) {
		return Math.round(value * 100.0) / 100.0;
	}

	public record NetworkCounterpartyView(String userId, double trustScore) {
	}

	public record TrustExplanationView(
		String factor,
		double metricValue,
		double contribution,
		String explanation,
		Instant calculatedAt
	) {
	}

	private record NetworkTrustSnapshot(
		double networkScore,
		double averagePartnerScore,
		double impact,
		List<NetworkCounterpartyView> counterparties
	) {
	}
}

