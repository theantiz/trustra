package xyz.antiz.Trustra.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import xyz.antiz.Trustra.repo.TrustScoreRepo;

@Component
public class MockUserBaseInitializer implements ApplicationRunner {

	private final TrustScoreRepo trustScoreRepo;
	private final SimulationService simulationService;

	public MockUserBaseInitializer(TrustScoreRepo trustScoreRepo, SimulationService simulationService) {
		this.trustScoreRepo = trustScoreRepo;
		this.simulationService = simulationService;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (trustScoreRepo.count() == 0) {
			simulationService.initializeMockUserBase();
		}
	}
}
