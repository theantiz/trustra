package xyz.antiz.Trustra.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import xyz.antiz.Trustra.dto.ScoringConfigDto;
import xyz.antiz.Trustra.entity.ScoringConfig;
import xyz.antiz.Trustra.repo.ScoringConfigRepo;

@Service
public class ScoringConfigService {

	private static final String DEFAULT_CONFIG_KEY = "DEFAULT";
	private final ScoringConfigRepo scoringConfigRepo;
	private volatile ScoringConfig cachedConfig;

	public ScoringConfigService(ScoringConfigRepo scoringConfigRepo) {
		this.scoringConfigRepo = scoringConfigRepo;
	}

	@Transactional
	public ScoringConfig getConfig() {
		if (cachedConfig != null) {
			return cachedConfig;
		}
		ScoringConfig config = scoringConfigRepo.findById(DEFAULT_CONFIG_KEY)
			.orElseGet(() -> {
				ScoringConfig defaultCfg = new ScoringConfig();
				defaultCfg.setConfigKey(DEFAULT_CONFIG_KEY);
				defaultCfg.setUpdatedAt(Instant.now());
				defaultCfg.setUpdatedBy("system");
				return scoringConfigRepo.save(defaultCfg);
			});
		cachedConfig = config;
		return config;
	}

	@Transactional(readOnly = true)
	public ScoringConfigDto getConfigDto() {
		ScoringConfig cfg = getConfig();
		return toDto(cfg);
	}

	@Transactional
	public ScoringConfigDto updateConfig(ScoringConfigDto dto, String updatedBy) {
		ScoringConfig config = scoringConfigRepo.findById(DEFAULT_CONFIG_KEY)
			.orElseGet(() -> {
				ScoringConfig c = new ScoringConfig();
				c.setConfigKey(DEFAULT_CONFIG_KEY);
				return c;
			});

		config.setSuccessWeight(dto.successWeight());
		config.setDisputeWeight(dto.disputeWeight());
		config.setFeedbackWeight(dto.feedbackWeight());
		config.setNetworkWeight(dto.networkWeight());
		config.setMaxInactivityPenalty(dto.maxInactivityPenalty());
		config.setNegativeFeedbackPenalty(dto.negativeFeedbackPenalty());
		config.setScamReportPenalty(dto.scamReportPenalty());
		config.setSpikePenalty(dto.spikePenalty());
		config.setFakeFeedbackPenalty(dto.fakeFeedbackPenalty());
		config.setClusterPenalty(dto.clusterPenalty());
		config.setUpdatedAt(Instant.now());
		config.setUpdatedBy(updatedBy != null ? updatedBy : "admin");

		ScoringConfig saved = scoringConfigRepo.save(config);
		cachedConfig = saved;
		return toDto(saved);
	}

	private ScoringConfigDto toDto(ScoringConfig cfg) {
		return new ScoringConfigDto(
			cfg.getSuccessWeight(),
			cfg.getDisputeWeight(),
			cfg.getFeedbackWeight(),
			cfg.getNetworkWeight(),
			cfg.getMaxInactivityPenalty(),
			cfg.getNegativeFeedbackPenalty(),
			cfg.getScamReportPenalty(),
			cfg.getSpikePenalty(),
			cfg.getFakeFeedbackPenalty(),
			cfg.getClusterPenalty(),
			cfg.getUpdatedAt(),
			cfg.getUpdatedBy()
		);
	}
}
