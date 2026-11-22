package xyz.antiz.Trustra.controller;

import java.security.Principal;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.dto.ScoringConfigDto;
import xyz.antiz.Trustra.dto.TrustScoreResponse;
import xyz.antiz.Trustra.service.ScoringConfigService;
import xyz.antiz.Trustra.service.TrustEngineService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final ScoringConfigService scoringConfigService;
	private final TrustEngineService trustEngineService;

	public AdminController(ScoringConfigService scoringConfigService, TrustEngineService trustEngineService) {
		this.scoringConfigService = scoringConfigService;
		this.trustEngineService = trustEngineService;
	}

	@GetMapping("/config")
	public ScoringConfigDto getConfig() {
		return scoringConfigService.getConfigDto();
	}

	@PutMapping("/config")
	public ScoringConfigDto updateConfig(@Valid @RequestBody ScoringConfigDto configDto, Principal principal) {
		String adminUser = principal != null ? principal.getName() : "admin";
		return scoringConfigService.updateConfig(configDto, adminUser);
	}

	@PostMapping("/recalculate")
	public List<TrustScoreResponse> recalculateAll() {
		return trustEngineService.recalculateAll().stream()
			.map(TrustScoreResponse::fromEntity)
			.toList();
	}
}
