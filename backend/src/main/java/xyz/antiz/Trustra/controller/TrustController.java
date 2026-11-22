package xyz.antiz.Trustra.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.dto.TrustScoreHistoryResponse;
import xyz.antiz.Trustra.dto.TrustScoreResponse;
import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.service.TrustEngineService;
import xyz.antiz.Trustra.service.TrustEngineService.TrustExplanationView;

@RestController
@RequestMapping("/api/trust")
public class TrustController {

	private final TrustEngineService trustEngineService;

	public TrustController(TrustEngineService trustEngineService) {
		this.trustEngineService = trustEngineService;
	}

	@GetMapping("/{userId}")
	public TrustScoreResponse get(@PathVariable String userId) {
		TrustScore trustScore = trustEngineService.get(userId);
		return toResponse(trustScore);
	}

	@GetMapping("/{userId}/explanations")
	public List<TrustExplanationView> getExplanations(@PathVariable String userId) {
		return trustEngineService.getExplanations(userId);
	}

	@GetMapping("/{userId}/history")
	public List<TrustScoreHistoryResponse> getHistory(@PathVariable String userId) {
		return trustEngineService.getHistory(userId);
	}

	@PostMapping("/{userId}/recalculate")
	public TrustScoreResponse recalculate(@PathVariable String userId) {
		TrustScore trustScore = trustEngineService.recalculate(userId, "MANUAL_API_TRIGGER");
		return toResponse(trustScore);
	}

	@PostMapping("/recalculate-all")
	public List<TrustScoreResponse> recalculateAll() {
		return trustEngineService.recalculateAll().stream()
			.map(this::toResponse)
			.toList();
	}

	private TrustScoreResponse toResponse(TrustScore ts) {
		double score = ts.getScore() != null ? ts.getScore() : 50.0;
		return new TrustScoreResponse(
			ts.getId(),
			ts.getUserId(),
			score,
			TrustScoreResponse.determineTrustLevel(score),
			ts.getSuccessRate() != null ? ts.getSuccessRate() : 0.0,
			ts.getDisputeRate() != null ? ts.getDisputeRate() : 0.0,
			ts.getAverageRating() != null ? ts.getAverageRating() : 0.0,
			ts.getCalculatedAt(),
			ts.getLastActivityAt()
		);
	}
}
