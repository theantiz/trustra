package xyz.antiz.Trustra.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;

@Service
@Transactional(readOnly = true)
public class AbuseDetectionService {

	private final TransactionRepo transactionRepo;
	private final FeedbackRepo feedbackRepo;

	public AbuseDetectionService(TransactionRepo transactionRepo, FeedbackRepo feedbackRepo) {
		this.transactionRepo = transactionRepo;
		this.feedbackRepo = feedbackRepo;
	}

	public List<AbuseFlag> detect(String userId) {
		List<AbuseFlag> flags = new ArrayList<>();
		Instant now = Instant.now();

		long last24hCount = transactionRepo.countTransactionsForUserSince(userId, now.minus(24, ChronoUnit.HOURS));
		long last30DaysCount = transactionRepo.countTransactionsForUserSince(userId, now.minus(30, ChronoUnit.DAYS));
		double avgDaily = last30DaysCount / 30.0;
		double spikeThreshold = Math.max(10.0, 5.0 * avgDaily);
		if (last24hCount > spikeThreshold) {
			flags.add(buildFlag(
				userId,
				"SPIKE",
				severityForSpike(last24hCount, spikeThreshold),
				String.format(
					"Transaction spike detected: %d transactions in the last 24 hours versus a threshold of %.2f based on the last 30 days.",
					last24hCount,
					spikeThreshold
				)
			));
		}

		long feedback24h = feedbackRepo.countFeedbackReceivedSince(userId, now.minus(24, ChronoUnit.HOURS));
		if (feedback24h > 15) {
			flags.add(buildFlag(
				userId,
				"FAKE_FEEDBACK",
				severityForFeedback(feedback24h),
				String.format(
					"Unusual feedback velocity detected: %d feedback items received in the last 24 hours.",
					feedback24h
				)
			));
		}

		List<Transaction> recentTransactions = transactionRepo.findTop50BySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
		int totalTx = recentTransactions.size();
		Set<String> counterparties = new HashSet<>();
		for (Transaction transaction : recentTransactions) {
			String counterparty = userId.equals(transaction.getSenderId())
				? transaction.getReceiverId()
				: transaction.getSenderId();
			counterparties.add(counterparty);
		}
		if (totalTx >= 20 && counterparties.size() <= 2) {
			flags.add(buildFlag(
				userId,
				"CLUSTER",
				severityForCluster(totalTx, counterparties.size()),
				String.format(
					"Cluster pattern detected: %d recent transactions involve only %d unique counterparties.",
					totalTx,
					counterparties.size()
				)
			));
		}

		return flags;
	}

	private AbuseFlag buildFlag(String userId, String flagType, String severity, String details) {
		AbuseFlag flag = new AbuseFlag();
		flag.setUserId(userId);
		flag.setFlagType(flagType);
		flag.setSeverity(severity);
		flag.setDetails(details);
		return flag;
	}

	private String severityForSpike(long last24hCount, double threshold) {
		if (last24hCount >= threshold * 2) {
			return "HIGH";
		}
		if (last24hCount >= threshold * 1.5) {
			return "MED";
		}
		return "LOW";
	}

	private String severityForFeedback(long feedback24h) {
		if (feedback24h > 30) {
			return "HIGH";
		}
		if (feedback24h > 20) {
			return "MED";
		}
		return "LOW";
	}

	private String severityForCluster(int totalTx, int uniqueCounterparties) {
		if (uniqueCounterparties <= 1 || totalTx >= 35) {
			return "HIGH";
		}
		if (totalTx >= 25) {
			return "MED";
		}
		return "LOW";
	}
}
