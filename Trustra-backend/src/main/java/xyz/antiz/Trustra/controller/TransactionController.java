package xyz.antiz.Trustra.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.entity.Transaction;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.service.TrustEngineService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

	private final TransactionRepo transactionRepo;
	private final TrustEngineService trustEngineService;

	public TransactionController(TransactionRepo transactionRepo, TrustEngineService trustEngineService) {
		this.transactionRepo = transactionRepo;
		this.trustEngineService = trustEngineService;
	}

	@PostMapping
	public Transaction create(@Valid @RequestBody CreateTransactionRequest request) {
		Transaction transaction = new Transaction();
		transaction.setSenderId(request.senderId());
		transaction.setReceiverId(request.receiverId());
		transaction.setAmount(request.amount());
		transaction.setStatus("SUCCESS");

		Transaction savedTransaction = transactionRepo.save(transaction);
		trustEngineService.touchActivity(savedTransaction.getReceiverId(), savedTransaction.getCreatedAt() == null ? Instant.now() : savedTransaction.getCreatedAt());
		trustEngineService.recalculate(savedTransaction.getReceiverId());
		return savedTransaction;
	}

	@GetMapping
	public List<Transaction> getByUser(@RequestParam String userId) {
		return transactionRepo.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
	}

	public record CreateTransactionRequest(
		@NotBlank String senderId,
		@NotBlank String receiverId,
		@NotNull @DecimalMin(value = "0.01") BigDecimal amount
	) {
	}
}
