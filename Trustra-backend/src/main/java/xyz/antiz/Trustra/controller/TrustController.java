package xyz.antiz.Trustra.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.service.TrustEngineService;

@RestController
@RequestMapping("/api/trust")
public class TrustController {

	private final TrustEngineService trustEngineService;

	public TrustController(TrustEngineService trustEngineService) {
		this.trustEngineService = trustEngineService;
	}

	@GetMapping("/{userId}")
	public TrustScore get(@PathVariable String userId) {
		return trustEngineService.get(userId);
	}

	@PostMapping("/{userId}/recalculate")
	public TrustScore recalculate(@PathVariable String userId) {
		return trustEngineService.recalculate(userId);
	}

	@PostMapping("/recalculate-all")
	public List<TrustScore> recalculateAll() {
		return trustEngineService.recalculateAll();
	}

	@DeleteMapping("/{userId}/cache")
	public void evictCache(@PathVariable String userId) {
		trustEngineService.evictCache(userId);
	}
}
