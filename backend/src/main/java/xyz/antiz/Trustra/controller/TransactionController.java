package xyz.antiz.Trustra.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.dto.TransactionResponse;
import xyz.antiz.Trustra.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

	private final TransactionService transactionService;

	public TransactionController(TransactionService transactionService) {
		this.transactionService = transactionService;
	}

	@PostMapping
	public TransactionResponse create(
		@Valid @RequestBody CreateTransactionRequest request,
		@RequestHeader(value = "Idempotency-Key", required = false) String headerIdempotencyKey
	) {
		return transactionService.create(request, headerIdempotencyKey);
	}

	@GetMapping("/{id}")
	public TransactionResponse getById(@PathVariable UUID id) {
		return transactionService.getById(id);
	}

	@PostMapping("/{id}/dispute")
	public TransactionResponse dispute(@PathVariable UUID id) {
		return transactionService.dispute(id);
	}

	@PostMapping("/{id}/refund")
	public TransactionResponse refund(@PathVariable UUID id) {
		return transactionService.refund(id);
	}

	@GetMapping("/receiver-trust")
	public ReceiverTrustPreview getReceiverTrust(@RequestParam String receiverId) {
		return transactionService.getReceiverTrust(receiverId);
	}

	@GetMapping
	public List<TransactionResponse> getByUser(@RequestParam String userId) {
		return transactionService.getByUser(userId);
	}

	public record CreateTransactionRequest(
		@NotBlank String senderId,
		@NotBlank String receiverId,
		@NotNull @DecimalMin(value = "0.01") BigDecimal amount,
		String currency,
		String idempotencyKey
	) {
		public CreateTransactionRequest(String senderId, String receiverId, BigDecimal amount) {
			this(senderId, receiverId, amount, "USD", null);
		}
	}

	public record ReceiverTrustPreview(
		String userId,
		double score,
		double successRate,
		double disputeRate,
		double averageRating,
		Instant calculatedAt,
		Instant lastActivityAt
	) {
	}
}
