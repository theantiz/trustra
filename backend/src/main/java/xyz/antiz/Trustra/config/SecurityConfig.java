package xyz.antiz.Trustra.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final String frontendOrigin;

	public SecurityConfig(
		JwtAuthenticationFilter jwtAuthenticationFilter,
		@Value("${trustra.frontend.origin:http://localhost:3000}") String frontendOrigin
	) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.frontendOrigin = frontendOrigin;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
			.authorizeHttpRequests(auth -> auth
				// Swagger & OpenAPI
				.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
				// Actuator & H2
				.requestMatchers("/actuator/**", "/h2-console/**").permitAll()
				// Auth endpoints
				.requestMatchers("/api/auth/**").permitAll()
				// Admin endpoints require ADMIN authority
				.requestMatchers("/api/admin/**").hasRole("ADMIN")
				// Simulation & Demo endpoints
				.requestMatchers("/api/sim/**").permitAll()
				// Trust, Network, Abuse read & calculation endpoints
				.requestMatchers(HttpMethod.GET, "/api/trust/**", "/api/network/**", "/api/abuse/**").permitAll()
				.requestMatchers(HttpMethod.POST, "/api/trust/**").permitAll()
				// Transactions & Feedback endpoints
				.requestMatchers("/api/transactions/**", "/api/feedback/**").permitAll()
				// Any other requests require authentication
				.anyRequest().authenticated()
			)
			.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(List.of("*"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Correlation-ID", "X-API-KEY", "Idempotency-Key"));
		configuration.setExposedHeaders(Arrays.asList("X-Correlation-ID", "Idempotency-Key"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
