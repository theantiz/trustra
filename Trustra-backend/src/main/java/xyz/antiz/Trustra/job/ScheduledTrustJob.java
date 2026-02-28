package xyz.antiz.Trustra.job;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import xyz.antiz.Trustra.service.TrustEngineService;

@Component
@ConditionalOnProperty(name = "trustra.scheduling.recalculation.enabled", havingValue = "true", matchIfMissing = true)
public class ScheduledTrustJob {

	private final TrustEngineService trustEngineService;

	public ScheduledTrustJob(TrustEngineService trustEngineService) {
		this.trustEngineService = trustEngineService;
	}

	@Scheduled(fixedRateString = "${trustra.scheduling.recalculation.fixed-rate-ms:3600000}")
	public void recalculateAllTrustScores() {
		trustEngineService.recalculateAll();
	}
}
