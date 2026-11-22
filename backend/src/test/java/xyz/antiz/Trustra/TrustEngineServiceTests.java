package xyz.antiz.Trustra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.ScoringConfig;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustExplanationRepo;
import xyz.antiz.Trustra.repo.TrustScoreHistoryRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;
import xyz.antiz.Trustra.service.AbuseDetectionService;
import xyz.antiz.Trustra.service.ScoringConfigService;
import xyz.antiz.Trustra.service.TrustEngineService;

@ExtendWith(MockitoExtension.class)
class TrustEngineServiceTests {

	@Mock
	private TransactionRepo transactionRepo;

	@Mock
	private FeedbackRepo feedbackRepo;

	@Mock
	private TrustScoreRepo trustScoreRepo;

	@Mock
	private TrustExplanationRepo trustExplanationRepo;

	@Mock
	private TrustScoreHistoryRepo trustScoreHistoryRepo;

	@Mock
	private AbuseDetectionService abuseDetectionService;

	@Mock
	private AbuseFlagRepo abuseFlagRepo;

	@Mock
	private ScoringConfigService scoringConfigService;

	private TrustEngineService trustEngineService;
	private ScoringConfig scoringConfig;

	@BeforeEach
	void setUp() {
		scoringConfig = new ScoringConfig();
		scoringConfig.setSuccessWeight(50.0);
		scoringConfig.setDisputeWeight(30.0);
		scoringConfig.setFeedbackWeight(20.0);
		scoringConfig.setNetworkWeight(30.0);
		scoringConfig.setMaxInactivityPenalty(20.0);
		scoringConfig.setNegativeFeedbackPenalty(2.0);
		scoringConfig.setScamReportPenalty(5.0);
		scoringConfig.setSpikePenalty(8.0);
		scoringConfig.setFakeFeedbackPenalty(12.0);
		scoringConfig.setClusterPenalty(15.0);

		when(scoringConfigService.getConfig()).thenReturn(scoringConfig);

		trustEngineService = new TrustEngineService(
			transactionRepo,
			feedbackRepo,
			trustScoreRepo,
			trustExplanationRepo,
			trustScoreHistoryRepo,
			abuseDetectionService,
			abuseFlagRepo,
			scoringConfigService
		);
	}

	@Test
	void perfectUserScoreCalculatesNearMaximum() {
		String userId = "perfect-user";

		when(trustScoreRepo.findByUserId(userId)).thenReturn(Optional.empty());
		when(transactionRepo.countByReceiverId(userId)).thenReturn(100L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "SUCCESS")).thenReturn(100L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "DISPUTE")).thenReturn(0L);
		when(feedbackRepo.countByToUserId(userId)).thenReturn(50L);
		when(feedbackRepo.averageRatingByToUserId(userId)).thenReturn(5.0);
		when(feedbackRepo.countByToUserIdAndType(userId, "NEGATIVE")).thenReturn(0L);
		when(feedbackRepo.countByToUserIdAndType(userId, "SCAM_REPORT")).thenReturn(0L);
		when(abuseDetectionService.detect(userId)).thenReturn(List.of());
		when(transactionRepo.findTop100BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(List.of());
		when(trustScoreRepo.save(any(TrustScore.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TrustScore result = trustEngineService.recalculate(userId);

		// 50 (success) + 30 (dispute) + 20 (feedback) = 100
		assertEquals(100.0, result.getScore());
		assertEquals(100.0, result.getSuccessRate());
		assertEquals(0.0, result.getDisputeRate());
		assertEquals(5.0, result.getAverageRating());
	}

	@Test
	void abusePenaltiesReduceScoreSubstantially() {
		String userId = "suspicious-user";

		when(trustScoreRepo.findByUserId(userId)).thenReturn(Optional.empty());
		when(transactionRepo.countByReceiverId(userId)).thenReturn(20L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "SUCCESS")).thenReturn(18L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "DISPUTE")).thenReturn(2L);
		when(feedbackRepo.countByToUserId(userId)).thenReturn(10L);
		when(feedbackRepo.averageRatingByToUserId(userId)).thenReturn(4.0);
		when(feedbackRepo.countByToUserIdAndType(userId, "NEGATIVE")).thenReturn(1L);
		when(feedbackRepo.countByToUserIdAndType(userId, "SCAM_REPORT")).thenReturn(1L);

		AbuseFlag spikeFlag = new AbuseFlag();
		spikeFlag.setFlagType("SPIKE");
		spikeFlag.setSeverity("HIGH");

		AbuseFlag clusterFlag = new AbuseFlag();
		clusterFlag.setFlagType("CLUSTER");
		clusterFlag.setSeverity("HIGH");

		when(abuseDetectionService.detect(userId)).thenReturn(List.of(spikeFlag, clusterFlag));
		when(transactionRepo.findTop100BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(List.of());
		when(trustScoreRepo.save(any(TrustScore.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TrustScore result = trustEngineService.recalculate(userId);

		// Score is substantially reduced by penalties (-8 -15 - negative feedback penalty - scam penalty)
		assertTrue(result.getScore() < 60.0);
	}

	@Test
	void inactivityDecayPenalizesStaleAccounts() {
		String userId = "inactive-user";

		TrustScore existing = new TrustScore();
		existing.setUserId(userId);
		existing.setScore(85.0);
		// Inactive for 60 days
		existing.setLastActivityAt(Instant.now().minus(60, ChronoUnit.DAYS));

		when(trustScoreRepo.findByUserId(userId)).thenReturn(Optional.of(existing));
		when(transactionRepo.countByReceiverId(userId)).thenReturn(10L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "SUCCESS")).thenReturn(10L);
		when(transactionRepo.countByReceiverIdAndStatus(userId, "DISPUTE")).thenReturn(0L);
		when(feedbackRepo.countByToUserId(userId)).thenReturn(5L);
		when(feedbackRepo.averageRatingByToUserId(userId)).thenReturn(5.0);
		when(abuseDetectionService.detect(userId)).thenReturn(List.of());
		when(transactionRepo.findTop100BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(List.of());
		when(trustScoreRepo.save(any(TrustScore.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TrustScore result = trustEngineService.recalculate(userId);

		// Base 100 - (60 days / 10 = 6.0 penalty) = 94.0
		assertEquals(94.0, result.getScore());
	}
}
