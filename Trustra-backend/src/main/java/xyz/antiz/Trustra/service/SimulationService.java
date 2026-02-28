package xyz.antiz.Trustra.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.Feedback;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;

@Service
@Transactional
public class SimulationService {

	private static final int MIN_USERS = 20;
	private static final int DEFAULT_MOCK_USER_COUNT = 100;
	private static final List<MockUserSeed> DEFAULT_MOCK_USERS = Arrays.asList(
		new MockUserSeed("alice", 82.0, 96.0, 1.0, 4.9, 2),
		new MockUserSeed("bob", 76.0, 91.0, 2.0, 4.6, 3),
		new MockUserSeed("carol", 71.0, 89.0, 3.0, 4.4, 5),
		new MockUserSeed("dave", 65.0, 84.0, 5.0, 4.1, 9),
		new MockUserSeed("eve", 58.0, 78.0, 7.0, 3.8, 12),
		new MockUserSeed("mallory", 44.0, 68.0, 12.0, 3.0, 16),
		new MockUserSeed("trent", 80.0, 94.0, 1.0, 4.8, 1),
		new MockUserSeed("peggy", 74.0, 88.0, 3.0, 4.3, 4),
		new MockUserSeed("victor", 62.0, 82.0, 6.0, 3.9, 11),
		new MockUserSeed("walter", 55.0, 75.0, 8.0, 3.5, 18),
		new MockUserSeed("judy", 79.0, 93.0, 2.0, 4.7, 2),
		new MockUserSeed("oscar", 67.0, 86.0, 4.0, 4.0, 7)
	);

	private final TransactionRepo transactionRepo;
	private final FeedbackRepo feedbackRepo;
	private final TrustScoreRepo trustScoreRepo;
	private final AbuseFlagRepo abuseFlagRepo;
	private final TrustEngineService trustEngineService;

	public SimulationService(
		TransactionRepo transactionRepo,
		FeedbackRepo feedbackRepo,
		TrustScoreRepo trustScoreRepo,
		AbuseFlagRepo abuseFlagRepo,
		TrustEngineService trustEngineService
	) {
		this.transactionRepo = transactionRepo;
		this.feedbackRepo = feedbackRepo;
		this.trustScoreRepo = trustScoreRepo;
		this.abuseFlagRepo = abuseFlagRepo;
		this.trustEngineService = trustEngineService;
	}

	public void initializeUsers(int count) {
		for (int index = 0; index < count; index++) {
			String userId = generateUserId();
			upsertBaselineUser(
				userId,
				round(randomDouble(55.0, 85.0)),
				round(randomDouble(70.0, 98.0)),
				round(randomDouble(0.0, 8.0)),
				round(randomDouble(3.6, 4.9)),
				Instant.now().minus(randomLong(0, 20), ChronoUnit.DAYS)
			);
		}
	}

	public void initializeMockUserBase() {
		for (MockUserSeed mockUserSeed : DEFAULT_MOCK_USERS) {
			upsertBaselineUser(
				mockUserSeed.userId(),
				mockUserSeed.score(),
				mockUserSeed.successRate(),
				mockUserSeed.disputeRate(),
				mockUserSeed.averageRating(),
				Instant.now().minus(mockUserSeed.daysSinceActivity(), ChronoUnit.DAYS)
			);
		}
		long currentUsers = trustScoreRepo.count();
		int remainingUsers = Math.max(0, DEFAULT_MOCK_USER_COUNT - (int) currentUsers);
		if (remainingUsers > 0) {
			initializeUsers(remainingUsers);
		}
	}

	public void simulateNormalActivity(int steps) {
		ensureMinimumUsers(MIN_USERS);
		List<String> userIds = getAllUserIds();
		for (int index = 0; index < steps; index++) {
			String senderId = randomUser(userIds);
			String receiverId = randomDifferentUser(userIds, senderId);
			Instant activityAt = Instant.now().minus(randomLong(0, 14 * 24L), ChronoUnit.HOURS);

			createTransaction(senderId, receiverId, randomAmount(15.0, 250.0), "SUCCESS", activityAt);

			if (ThreadLocalRandom.current().nextDouble() < 0.45d) {
				createFeedback(
					senderId,
					receiverId,
					randomInt(4, 5),
					"POSITIVE",
					"Smooth payment flow during demo simulation.",
					activityAt.plus(randomLong(1, 20), ChronoUnit.MINUTES)
				);
			}
		}
	}

	public void simulateMaliciousCluster(int clusterSize, int steps) {
		int safeClusterSize = Math.max(2, clusterSize);
		ensureMinimumUsers(Math.max(MIN_USERS, safeClusterSize));
		List<String> clusterUsers = pickClusterUsers(safeClusterSize);
		for (int index = 0; index < steps; index++) {
			String senderId = clusterUsers.get(index % clusterUsers.size());
			int offset = ThreadLocalRandom.current().nextBoolean() ? 1 : 2;
			String receiverId = clusterUsers.get((index + offset) % clusterUsers.size());
			if (senderId.equals(receiverId)) {
				receiverId = clusterUsers.get((index + 1) % clusterUsers.size());
			}
			Instant activityAt = Instant.now().minus(randomLong(0, 6 * 60L), ChronoUnit.MINUTES);

			createTransaction(senderId, receiverId, randomAmount(5.0, 40.0), "SUCCESS", activityAt);
			createFeedback(
				senderId,
				receiverId,
				5,
				"POSITIVE",
				"Trusted partner in the simulated cluster.",
				activityAt.plus(randomLong(1, 5), ChronoUnit.MINUTES)
			);
			if (ThreadLocalRandom.current().nextDouble() < 0.35d) {
				createFeedback(
					clusterUsers.get((index + 2) % clusterUsers.size()),
					receiverId,
					5,
					"POSITIVE",
					"Repeated positive signal from the same simulated network.",
					activityAt.plus(randomLong(2, 10), ChronoUnit.MINUTES)
				);
			}
		}
	}

	public void simulateSpike(String userId) {
		ensureUserExists(userId);
		ensureMinimumUsers(MIN_USERS);
		List<String> userIds = getAllUserIds();
		int burstSize = randomInt(28, 40);
		for (int index = 0; index < burstSize; index++) {
			String senderId = randomDifferentUser(userIds, userId);
			Instant activityAt = Instant.now().minus(randomLong(0, 59), ChronoUnit.MINUTES);
			createTransaction(senderId, userId, randomAmount(20.0, 400.0), "SUCCESS", activityAt);
		}
	}

	@Transactional(readOnly = true)
	public SimulationStats getStats() {
		List<TrustScore> trustScores = trustScoreRepo.findAll();
		int totalUsers = trustScores.size();
		double averageTrustScore = trustScores.stream()
			.mapToDouble(trustScore -> trustScore.getScore() == null ? 0.0 : trustScore.getScore())
			.average()
			.orElse(0.0);

		Set<String> flaggedUsers = new HashSet<>();
		for (AbuseFlag abuseFlag : abuseFlagRepo.findAll()) {
			flaggedUsers.add(abuseFlag.getUserId());
		}

		TrustScore highest = trustScores.stream()
			.max(Comparator.comparingDouble(trustScore -> trustScore.getScore() == null ? 0.0 : trustScore.getScore()))
			.orElse(null);
		TrustScore lowest = trustScores.stream()
			.min(Comparator.comparingDouble(trustScore -> trustScore.getScore() == null ? 0.0 : trustScore.getScore()))
			.orElse(null);

		return new SimulationStats(
			totalUsers,
			round(averageTrustScore),
			flaggedUsers.size(),
			toSummary(highest),
			toSummary(lowest)
		);
	}

	private void createTransaction(String senderId, String receiverId, BigDecimal amount, String status, Instant createdAt) {
		Transaction transaction = new Transaction();
		transaction.setSenderId(senderId);
		transaction.setReceiverId(receiverId);
		transaction.setAmount(amount);
		transaction.setStatus(status);
		transaction.setCreatedAt(createdAt);
		transactionRepo.save(transaction);
		trustEngineService.touchActivity(receiverId, createdAt);
		trustEngineService.recalculate(receiverId);
	}

	private void createFeedback(
		String fromUserId,
		String toUserId,
		int rating,
		String type,
		String comment,
		Instant createdAt
	) {
		Feedback feedback = new Feedback();
		feedback.setFromUserId(fromUserId);
		feedback.setToUserId(toUserId);
		feedback.setRating(rating);
		feedback.setType(type);
		feedback.setComment(comment);
		feedback.setCreatedAt(createdAt);
		feedbackRepo.save(feedback);
		trustEngineService.touchActivity(toUserId, createdAt);
		trustEngineService.recalculate(toUserId);
	}

	private void ensureMinimumUsers(int minimum) {
		long existingUsers = trustScoreRepo.count();
		if (existingUsers < minimum) {
			initializeUsers((int) (minimum - existingUsers));
		}
	}

	private void ensureUserExists(String userId) {
		if (trustScoreRepo.findByUserId(userId).isPresent()) {
			return;
		}

		upsertBaselineUser(
			userId,
			round(randomDouble(60.0, 80.0)),
			round(randomDouble(75.0, 95.0)),
			round(randomDouble(0.0, 5.0)),
			round(randomDouble(4.0, 5.0)),
			Instant.now()
		);
	}

	private void upsertBaselineUser(
		String userId,
		double score,
		double successRate,
		double disputeRate,
		double averageRating,
		Instant lastActivityAt
	) {
		TrustScore trustScore = trustScoreRepo.findByUserId(userId).orElseGet(TrustScore::new);
		trustScore.setUserId(userId);
		trustScore.setScore(score);
		trustScore.setSuccessRate(successRate);
		trustScore.setDisputeRate(disputeRate);
		trustScore.setAverageRating(averageRating);
		trustScore.setLastActivityAt(lastActivityAt);
		trustScoreRepo.save(trustScore);
	}

	private List<String> getAllUserIds() {
		List<String> userIds = new ArrayList<>();
		for (TrustScore trustScore : trustScoreRepo.findAll()) {
			userIds.add(trustScore.getUserId());
		}
		return userIds;
	}

	private List<String> pickClusterUsers(int clusterSize) {
		List<String> allUsers = getAllUserIds();
		List<String> selectedUsers = new ArrayList<>();
		Set<String> seen = new HashSet<>();
		while (selectedUsers.size() < Math.min(clusterSize, allUsers.size())) {
			String userId = randomUser(allUsers);
			if (seen.add(userId)) {
				selectedUsers.add(userId);
			}
		}
		return selectedUsers;
	}

	private SimulationUserSummary toSummary(TrustScore trustScore) {
		if (trustScore == null) {
			return null;
		}
		return new SimulationUserSummary(trustScore.getUserId(), round(trustScore.getScore() == null ? 0.0 : trustScore.getScore()));
	}

	private String generateUserId() {
		return "demo-" + UUID.randomUUID().toString().substring(0, 8);
	}

	private String randomUser(List<String> userIds) {
		return userIds.get(ThreadLocalRandom.current().nextInt(userIds.size()));
	}

	private String randomDifferentUser(List<String> userIds, String excludedUserId) {
		String userId = randomUser(userIds);
		while (userId.equals(excludedUserId)) {
			userId = randomUser(userIds);
		}
		return userId;
	}

	private BigDecimal randomAmount(double min, double max) {
		return BigDecimal.valueOf(round(randomDouble(min, max)));
	}

	private double randomDouble(double min, double max) {
		return ThreadLocalRandom.current().nextDouble(min, max);
	}

	private int randomInt(int min, int max) {
		return ThreadLocalRandom.current().nextInt(min, max + 1);
	}

	private long randomLong(long minInclusive, long maxInclusive) {
		return ThreadLocalRandom.current().nextLong(minInclusive, maxInclusive + 1);
	}

	private double round(double value) {
		return Math.round(value * 100.0) / 100.0;
	}

	public record SimulationStats(
		int totalUsers,
		double avgTrustScore,
		int flaggedUsersCount,
		SimulationUserSummary highestTrustUser,
		SimulationUserSummary lowestTrustUser
	) {
	}

	public record SimulationUserSummary(String userId, double score) {
	}

	private record MockUserSeed(
		String userId,
		double score,
		double successRate,
		double disputeRate,
		double averageRating,
		long daysSinceActivity
	) {
	}
}
