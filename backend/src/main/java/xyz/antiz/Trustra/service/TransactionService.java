package xyz.antiz.Trustra.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import xyz.antiz.Trustra.controller.TransactionController.CreateTransactionRequest;
import xyz.antiz.Trustra.controller.TransactionController.ReceiverTrustPreview;
import xyz.antiz.Trustra.dto.TransactionResponse;
import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.entity.TransactionStatus;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.exception.DuplicateIdempotencyException;
import xyz.antiz.Trustra.exception.ResourceNotFoundException;
import xyz.antiz.Trustra.repo.TransactionRepo;

@Service
public class TransactionService {

	private final TransactionRepo transactionRepo;
	private final TrustEngineService trustEngineService;

	public TransactionService(TransactionRepo transactionRepo, TrustEngineService trustEngineService) {
		this.transactionRepo = transactionRepo;
		this.trustEngineService = trustEngineService;
	}

	@Transactional
	public TransactionResponse create(CreateTransactionRequest request, String headerIdempotencyKey) {
		String idempotencyKey = headerIdempotencyKey != null && !headerIdempotencyKey.isBlank()
			? headerIdempotencyKey.trim()
			: (request.idempotencyKey() != null && !request.idempotencyKey().isBlank() ? request.idempotencyKey().trim() : null);

		if (idempotencyKey != null) {
			Optional<Transaction> existing = transactionRepo.findByIdempotencyKey(idempotencyKey);
			if (existing.isPresent()) {
				Transaction ex = existing.get();
				// Check for conflicting payload with same key
				if (!ex.getSenderId().equals(request.senderId())
					|| !ex.getReceiverId().equals(request.receiverId())
					|| ex.getAmount().compareTo(request.amount()) != 0) {
					throw new DuplicateIdempotencyException(
						"Idempotency key '" + idempotencyKey + "' already exists with conflicting transaction details"
					);
				}
				// Idempotent return of existing transaction
				return TransactionResponse.fromEntity(ex);
			}
		}

		Transaction transaction = new Transaction();
		transaction.setIdempotencyKey(idempotencyKey);
		transaction.setSenderId(request.senderId());
		transaction.setReceiverId(request.receiverId());
		transaction.setAmount(request.amount());
		transaction.setCurrency(request.currency() != null && !request.currency().isBlank() ? request.currency().toUpperCase().trim() : "USD");
		transaction.setStatus(TransactionStatus.SUCCESS.name());

		Transaction savedTransaction = transactionRepo.save(transaction);
		Instant activityTime = savedTransaction.getCreatedAt() == null ? Instant.now() : savedTransaction.getCreatedAt();
		trustEngineService.touchActivity(savedTransaction.getReceiverId(), activityTime);
		trustEngineService.recalculate(savedTransaction.getReceiverId(), "TRANSACTION_EVENT");
		return TransactionResponse.fromEntity(savedTransaction);
	}

	@Transactional(readOnly = true)
	public TransactionResponse getById(UUID id) {
		Transaction transaction = transactionRepo.findById(id)
			.orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));
		return TransactionResponse.fromEntity(transaction);
	}

	@Transactional
	public TransactionResponse dispute(UUID id) {
		Transaction transaction = transactionRepo.findById(id)
			.orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

		transaction.setStatus(TransactionStatus.DISPUTE.name());
		Transaction savedTransaction = transactionRepo.save(transaction);

		trustEngineService.recalculate(savedTransaction.getReceiverId(), "DISPUTE_EVENT");
		return TransactionResponse.fromEntity(savedTransaction);
	}

	@Transactional
	public TransactionResponse refund(UUID id) {
		Transaction transaction = transactionRepo.findById(id)
			.orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

		transaction.setStatus(TransactionStatus.REFUNDED.name());
		Transaction savedTransaction = transactionRepo.save(transaction);

		return TransactionResponse.fromEntity(savedTransaction);
	}

	@Transactional(readOnly = true)
	public List<TransactionResponse> getByUser(String userId) {
		return transactionRepo.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId).stream()
			.map(TransactionResponse::fromEntity)
			.toList();
	}

	@Transactional(readOnly = true)
	public ReceiverTrustPreview getReceiverTrust(String receiverId) {
		String sanitizedReceiverId = receiverId == null ? "" : receiverId.trim();
		if (sanitizedReceiverId.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "receiverId is required");
		}

		TrustScore trustScore = trustEngineService.get(sanitizedReceiverId);
		return new ReceiverTrustPreview(
			trustScore.getUserId(),
			trustScore.getScore(),
			trustScore.getSuccessRate(),
			trustScore.getDisputeRate(),
			trustScore.getAverageRating(),
			trustScore.getCalculatedAt(),
			trustScore.getLastActivityAt()
		);
	}
}
