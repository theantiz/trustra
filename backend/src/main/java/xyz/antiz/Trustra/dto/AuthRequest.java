package xyz.antiz.Trustra.dto;

import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
	@NotBlank String username,
	@NotBlank String password
) {
}
