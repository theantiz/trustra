package xyz.antiz.Trustra.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import xyz.antiz.Trustra.config.CacheConfig;
import xyz.antiz.Trustra.dto.TrustScoreHistoryResponse;
import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.ScoringConfig;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.entity.TrustExplanation;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.entity.TrustScoreHistory;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustExplanationRepo;
import xyz.antiz.Trustra.repo.TrustScoreHistoryRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;
import xyz.antiz.Trustra.service.AbuseDetectionService;
import xyz.antiz.Trustra.service.ScoringConfigService;

@Service
public class TrustEngineService {

	private static final double MAX_FEEDBACK_RATING = 5.0;

	private final TransactionRepo transactionRepo;
	private final FeedbackRepo feedbackRepo;
	private final TrustScoreRepo trustScoreRepo;
	private final TrustExplanationRepo trustExplanationRepo;
	private final TrustScoreHistoryRepo trustScoreHistoryRepo;
	private final AbuseDetectionService abuseDetectionService;
	private final AbuseFlagRepo abuseFlagRepo;
	private final ScoringConfigService scoringConfigService;
	private final CacheManager cacheManager;

	@Autowired
	public TrustEngineService(
		TransactionRepo transactionRepo,
		FeedbackRepo feedbackRepo,
		TrustScoreRepo trustScoreRepo,
		TrustExplanationRepo trustExplanationRepo,
		TrustScoreHistoryRepo trustScoreHistoryRepo,
		AbuseDetectionService abuseDetectionService,
		AbuseFlagRepo abuseFlagRepo,
		ScoringConfigService scoringConfigService,
		CacheManager cacheManager
	) {
		this.transactionRepo = transactionRepo;
		this.feedbackRepo = feedbackRepo;
		this.trustScoreRepo = trustScoreRepo;
		this.trustExplanationRepo = trustExplanationRepo;
		this.trustScoreHistoryRepo = trustScoreHistoryRepo;
		this.abuseDetectionService = abuseDetectionService;
		this.abuseFlagRepo = abuseFlagRepo;
		this.scoringConfigService = scoringConfigService;
		this.cacheManager = cacheManager;
	}

	public TrustEngineService(
		TransactionRepo transactionRepo,
		FeedbackRepo feedbackRepo,
		TrustScoreRepo trustScoreRepo,
		TrustExplanationRepo trustExplanationRepo,
		TrustScoreHistoryRepo trustScoreHistoryRepo,
		AbuseDetectionService abuseDetectionService,
		AbuseFlagRepo abuseFlagRepo,
		ScoringConfigService scoringConfigService
	) {
		this(
			transactionRepo,
			feedbackRepo,
			trustScoreRepo,
			trustExplanationRepo,
			trustScoreHistoryRepo,
			abuseDetectionService,
			abuseFlagRepo,
			scoringConfigService,
			null
		);
	}

	@Cacheable(value = CacheConfig.TRUST_SCORES_CACHE, key = "#userId")
	@Transactional
	public TrustScore get(String userId) {
		return trustScoreRepo.findByUserId(userId).orElseGet(() -> recalculate(userId));
	}

	@Transactional(readOnly = true)
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

	@Transactional(readOnly = true)
	public List<TrustScoreHistoryResponse> getHistory(String userId) {
		return trustScoreHistoryRepo.findByUserIdOrderByRecordedAtDesc(userId).stream()
			.map(history -> new TrustScoreHistoryResponse(
				history.getId(),
				history.getUserId(),
				history.getScore(),
				history.getSuccessRate(),
				history.getDisputeRate(),
				history.getAverageRating(),
				history.getTriggerReason(),
				history.getRecordedAt()
			))
			.toList();
	}

	@CacheEvict(value = CacheConfig.TRUST_SCORES_CACHE, key = "#userId")
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
		evictCache(userId);
	}

	@CacheEvict(value = CacheConfig.TRUST_SCORES_CACHE, allEntries = true)
	@Transactional
	public List<TrustScore> recalculateAll() {
		clearCache();
		return trustScoreRepo.findAll().stream()
			.map(trustScore -> recalculate(trustScore.getUserId(), "SCHEDULED_RECALCULATION"))
			.toList();
	}

	@CachePut(value = CacheConfig.TRUST_SCORES_CACHE, key = "#userId")
	@Transactional
	public TrustScore recalculate(String userId) {
		return recalculate(userId, "MANUAL_RECALCULATION");
	}

	@CachePut(value = CacheConfig.TRUST_SCORES_CACHE, key = "#userId")
	@Transactional
	public TrustScore recalculate(String userId, String triggerReason) {
		ScoringConfig config = scoringConfigService.getConfig();

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

		double successContribution = totalTransactions == 0 ? 0.0 : (successRate / 100.0) * config.getSuccessWeight();
		double disputeContribution = totalTransactions == 0 ? 0.0 : ((100.0 - disputeRate) / 100.0) * config.getDisputeWeight();
		double feedbackContribution = totalFeedback == 0 ? 0.0 : (averageRating / MAX_FEEDBACK_RATING) * config.getFeedbackWeight();
		double negativeFeedbackPenalty = negativeFeedbackCount * config.getNegativeFeedbackPenalty();
		double scamReportPenalty = scamReportCount * config.getScamReportPenalty();
		double behavioralScore = preserveBaseline
			? existingScore
			: successContribution + disputeContribution + feedbackContribution - negativeFeedbackPenalty - scamReportPenalty;
		NetworkTrustSnapshot networkTrustSnapshot = buildNetworkTrustSnapshot(userId, config.getNetworkWeight());
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
				inactivityPenalty = Math.min(config.getMaxInactivityPenalty(), inactivityDays / 10.0);
			}
		}

		double totalPenalty = abuseFlags.stream().mapToDouble(flag -> penaltyFor(flag, config)).sum();
		double finalScore = behavioralScore + networkImpact - totalPenalty - inactivityPenalty;
		trustScore.setScore(round(clamp(finalScore)));

		TrustScore savedTrustScore = trustScoreRepo.save(trustScore);
		trustExplanationRepo.deleteByUserId(userId);
		abuseFlagRepo.deleteByUserId(userId);
		if (!abuseFlags.isEmpty()) {
			abuseFlagRepo.saveAll(abuseFlags);
		}

		// Record audit trail in TrustScoreHistory
		TrustScoreHistory history = new TrustScoreHistory();
		history.setUserId(userId);
		history.setScore(savedTrustScore.getScore());
		history.setSuccessRate(savedTrustScore.getSuccessRate());
		history.setDisputeRate(savedTrustScore.getDisputeRate());
		history.setAverageRating(savedTrustScore.getAverageRating());
		history.setTriggerReason(triggerReason != null ? triggerReason : "MANUAL_RECALCULATION");
		history.setRecordedAt(Instant.now());
		trustScoreHistoryRepo.save(history);

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
			double penalty = penaltyFor(abuseFlag, config);
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
		updateCache(userId, savedTrustScore);
		return savedTrustScore;
	}

	public double calculateNetworkScore(String userId) {
		return buildNetworkTrustSnapshot(userId, scoringConfigService.getConfig().getNetworkWeight()).networkScore();
	}

	@Transactional(readOnly = true)
	public List<NetworkCounterpartyView> getNetworkView(String userId) {
		return buildNetworkTrustSnapshot(userId, scoringConfigService.getConfig().getNetworkWeight()).counterparties();
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

	private NetworkTrustSnapshot buildNetworkTrustSnapshot(String userId, double networkWeight) {
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
		double impact = round((networkScore - 0.5) * networkWeight);
		return new NetworkTrustSnapshot(networkScore, round(averagePartnerScore), impact, counterparties);
	}

	private double penaltyFor(AbuseFlag abuseFlag, ScoringConfig config) {
		return switch (abuseFlag.getFlagType()) {
			case "SPIKE" -> config.getSpikePenalty();
			case "FAKE_FEEDBACK" -> config.getFakeFeedbackPenalty();
			case "CLUSTER" -> config.getClusterPenalty();
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

	private void updateCache(String userId, TrustScore trustScore) {
		if (cacheManager != null) {
			var cache = cacheManager.getCache(CacheConfig.TRUST_SCORES_CACHE);
			if (cache != null) {
				cache.put(userId, trustScore);
			}
		}
	}

	private void evictCache(String userId) {
		if (cacheManager != null) {
			var cache = cacheManager.getCache(CacheConfig.TRUST_SCORES_CACHE);
			if (cache != null) {
				cache.evict(userId);
			}
		}
	}

	private void clearCache() {
		if (cacheManager != null) {
			var cache = cacheManager.getCache(CacheConfig.TRUST_SCORES_CACHE);
			if (cache != null) {
				cache.clear();
			}
		}
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
