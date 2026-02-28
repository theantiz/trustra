package xyz.antiz.Trustra.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.service.SimulationService;
import xyz.antiz.Trustra.service.SimulationService.SimulationStats;

@RestController
@RequestMapping("/api/sim")
public class SimulationController {

	private final SimulationService simulationService;

	public SimulationController(SimulationService simulationService) {
		this.simulationService = simulationService;
	}

	@PostMapping("/init")
	public SimulationStats initializeUsers(@Valid @RequestBody InitRequest request) {
		simulationService.initializeUsers(request.users());
		return simulationService.getStats();
	}

	@PostMapping("/normal")
	public SimulationStats simulateNormalActivity(@Valid @RequestBody NormalRequest request) {
		simulationService.simulateNormalActivity(request.steps());
		return simulationService.getStats();
	}

	@PostMapping("/malicious")
	public SimulationStats simulateMaliciousCluster(@Valid @RequestBody MaliciousRequest request) {
		simulationService.simulateMaliciousCluster(request.clusterSize(), request.steps());
		return simulationService.getStats();
	}

	@PostMapping("/spike/{userId}")
	public SimulationStats simulateSpike(@PathVariable String userId) {
		simulationService.simulateSpike(userId);
		return simulationService.getStats();
	}

	@GetMapping("/stats")
	public SimulationStats getStats() {
		return simulationService.getStats();
	}

	public record InitRequest(@Min(1) int users) {
	}

	public record NormalRequest(@Min(1) int steps) {
	}

	public record MaliciousRequest(@Min(2) int clusterSize, @Min(1) int steps) {
	}
}
