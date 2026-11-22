package xyz.antiz.Trustra.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.dto.AuthRequest;
import xyz.antiz.Trustra.dto.AuthResponse;
import xyz.antiz.Trustra.service.JwtTokenService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final JwtTokenService jwtTokenService;

	public AuthController(JwtTokenService jwtTokenService) {
		this.jwtTokenService = jwtTokenService;
	}

	@PostMapping("/token")
	public AuthResponse login(@Valid @RequestBody AuthRequest request) {
		String username = request.username().trim();
		String password = request.password();

		List<String> roles;
		if ("admin".equalsIgnoreCase(username) && "admin123".equals(password)) {
			roles = List.of("ROLE_ADMIN", "ROLE_USER");
		} else if ("user".equalsIgnoreCase(username) && "password".equals(password)) {
			roles = List.of("ROLE_USER");
		} else if (!username.isBlank() && "password".equals(password)) {
			roles = List.of("ROLE_USER");
		} else {
			throw new BadCredentialsException("Invalid username or password");
		}

		String token = jwtTokenService.generateToken(username, roles);
		return new AuthResponse(
			token,
			"Bearer",
			username,
			roles,
			jwtTokenService.getExpirationSeconds()
		);
	}
}
