package xyz.antiz.Trustra.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

	public static final String TRUST_SCORES_CACHE = "trustScores";

	@Bean
	public CacheManager cacheManager() {
		return new ConcurrentMapCacheManager(TRUST_SCORES_CACHE);
	}
}
