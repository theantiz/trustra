package xyz.antiz.Trustra.controller;

import java.time.Instant;
import java.util.Locale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.entity.Feedback;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.service.TrustEngineService;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

	private final FeedbackRepo feedbackRepo;
	private final TrustEngineService trustEngineService;

	public FeedbackController(FeedbackRepo feedbackRepo, TrustEngineService trustEngineService) {
		this.feedbackRepo = feedbackRepo;
		this.trustEngineService = trustEngineService;
	}

	@PostMapping
	public Feedback create(@Valid @RequestBody CreateFeedbackRequest request) {
		Feedback feedback = new Feedback();
		feedback.setFromUserId(request.fromUserId());
		feedback.setToUserId(request.toUserId());
		feedback.setRating(request.rating());
		feedback.setType(request.type().trim().toUpperCase(Locale.ROOT));
		feedback.setComment(request.comment());

		Feedback savedFeedback = feedbackRepo.save(feedback);
		trustEngineService.touchActivity(savedFeedback.getToUserId(), savedFeedback.getCreatedAt() == null ? Instant.now() : savedFeedback.getCreatedAt());
		trustEngineService.recalculate(savedFeedback.getToUserId());
		return savedFeedback;
	}

	public record CreateFeedbackRequest(
		@NotBlank String fromUserId,
		@NotBlank String toUserId,
		@Min(1) @Max(5) int rating,
		@NotBlank String type,
		String comment
	) {
	}
}
