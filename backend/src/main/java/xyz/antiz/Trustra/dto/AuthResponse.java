package xyz.antiz.Trustra.dto;

import java.util.List;

public record AuthResponse(
	String token,
	String tokenType,
	String username,
	List<String> roles,
	long expiresInSeconds
) {
}
