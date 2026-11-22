package xyz.antiz.Trustra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.service.AbuseDetectionService;

@ExtendWith(MockitoExtension.class)
class AbuseDetectionServiceTests {

	@Mock
	private TransactionRepo transactionRepo;

	@Mock
	private FeedbackRepo feedbackRepo;

	private AbuseDetectionService abuseDetectionService;

	@BeforeEach
	void setUp() {
		abuseDetectionService = new AbuseDetectionService(transactionRepo, feedbackRepo);
	}

	@Test
	void transactionSpikeIsDetectedWhenVolumeExceedsThreshold() {
		String userId = "spiking-user";

		// 30 days count = 30 (avg 1/day). 24h count = 25 (spike threshold = max(10, 5 * 1) = 10)
		when(transactionRepo.countTransactionsForUserSince(eq(userId), any(Instant.class)))
			.thenReturn(25L) // 24h count
			.thenReturn(30L); // 30 days count

		when(feedbackRepo.countFeedbackReceivedSince(eq(userId), any(Instant.class))).thenReturn(2L);
		when(transactionRepo.findTop50BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(List.of());

		List<AbuseFlag> flags = abuseDetectionService.detect(userId);

		assertEquals(1, flags.size());
		assertEquals("SPIKE", flags.get(0).getFlagType());
		assertEquals("HIGH", flags.get(0).getSeverity());
	}

	@Test
	void fakeFeedbackVelocityIsDetected() {
		String userId = "review-farm-user";

		when(transactionRepo.countTransactionsForUserSince(eq(userId), any(Instant.class))).thenReturn(5L);
		// Feedback velocity in 24h > 15
		when(feedbackRepo.countFeedbackReceivedSince(eq(userId), any(Instant.class))).thenReturn(25L);
		when(transactionRepo.findTop50BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(List.of());

		List<AbuseFlag> flags = abuseDetectionService.detect(userId);

		assertEquals(1, flags.size());
		assertEquals("FAKE_FEEDBACK", flags.get(0).getFlagType());
		assertEquals("MED", flags.get(0).getSeverity());
	}

	@Test
	void clusterCollusionIsDetected() {
		String userId = "cluster-user";

		when(transactionRepo.countTransactionsForUserSince(eq(userId), any(Instant.class))).thenReturn(5L);
		when(feedbackRepo.countFeedbackReceivedSince(eq(userId), any(Instant.class))).thenReturn(2L);

		// 25 transactions with only 2 unique counterparties ("sybil-1" and "sybil-2")
		List<Transaction> transactions = new ArrayList<>();
		for (int i = 0; i < 25; i++) {
			Transaction t = new Transaction();
			t.setSenderId(userId);
			t.setReceiverId(i % 2 == 0 ? "sybil-1" : "sybil-2");
			transactions.add(t);
		}
		when(transactionRepo.findTop50BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId)).thenReturn(transactions);

		List<AbuseFlag> flags = abuseDetectionService.detect(userId);

		assertEquals(1, flags.size());
		assertEquals("CLUSTER", flags.get(0).getFlagType());
		assertEquals("MED", flags.get(0).getSeverity());
	}
}
