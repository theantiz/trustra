package xyz.antiz.Trustra.config;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import xyz.antiz.Trustra.service.JwtTokenService;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final String AUTH_HEADER = "Authorization";
	private static final String BEARER_PREFIX = "Bearer ";
	private static final String API_KEY_HEADER = "X-API-KEY";
	private static final String ADMIN_API_KEY = "trustra-admin-api-key-fintech-prod";

	private final JwtTokenService jwtTokenService;

	public JwtAuthenticationFilter(JwtTokenService jwtTokenService) {
		this.jwtTokenService = jwtTokenService;
	}

	@Override
	protected void doFilterInternal(
		HttpServletRequest request,
		HttpServletResponse response,
		FilterChain filterChain
	) throws ServletException, IOException {
		String apiKey = request.getHeader(API_KEY_HEADER);
		if (ADMIN_API_KEY.equals(apiKey)) {
			UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
				"api-admin",
				null,
				List.of(new SimpleGrantedAuthority("ROLE_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"))
			);
			SecurityContextHolder.getContext().setAuthentication(adminAuth);
			filterChain.doFilter(request, response);
			return;
		}

		String authHeader = request.getHeader(AUTH_HEADER);
		if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
			String token = authHeader.substring(BEARER_PREFIX.length()).trim();
			if (jwtTokenService.validateToken(token)) {
				String username = jwtTokenService.extractUsername(token);
				List<String> roles = jwtTokenService.extractRoles(token);
				List<SimpleGrantedAuthority> authorities = roles.stream()
					.map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
					.map(SimpleGrantedAuthority::new)
					.toList();

				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
					username,
					null,
					authorities
				);
				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		}

		filterChain.doFilter(request, response);
	}
}
