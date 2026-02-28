package xyz.antiz.Trustra.job;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import xyz.antiz.Trustra.service.TrustEngineService;

@Component
public class ScheduledTrustJob {

	private final TrustEngineService trustEngineService;

	public ScheduledTrustJob(TrustEngineService trustEngineService) {
		this.trustEngineService = trustEngineService;
	}

	@Scheduled(fixedRate = 3600000)
	public void recalculateAllTrustScores() {
		trustEngineService.recalculateAll();
	}
}
