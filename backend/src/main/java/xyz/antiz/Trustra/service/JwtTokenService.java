package xyz.antiz.Trustra.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

	private final SecretKey signingKey;
	private final long expirationSeconds;

	public JwtTokenService(
		@Value("${trustra.security.jwt.secret:trustra-fintech-super-secure-jwt-signing-secret-key-32bytes}") String secret,
		@Value("${trustra.security.jwt.expiration-seconds:86400}") long expirationSeconds
	) {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			byte[] padded = new byte[32];
			System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
			keyBytes = padded;
		}
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
		this.expirationSeconds = expirationSeconds;
	}

	public String generateToken(String username, List<String> roles) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + (expirationSeconds * 1000));

		return Jwts.builder()
			.subject(username)
			.claim("roles", roles)
			.issuedAt(now)
			.expiration(expiry)
			.signWith(signingKey)
			.compact();
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	public String extractUsername(String token) {
		return extractClaims(token).getSubject();
	}

	@SuppressWarnings("unchecked")
	public List<String> extractRoles(String token) {
		Claims claims = extractClaims(token);
		Object roles = claims.get("roles");
		if (roles instanceof List<?> list) {
			return (List<String>) list;
		}
		return List.of();
	}

	public long getExpirationSeconds() {
		return expirationSeconds;
	}

	private Claims extractClaims(String token) {
		return Jwts.parser()
			.verifyWith(signingKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}
}
