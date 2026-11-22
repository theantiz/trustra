package xyz.antiz.Trustra.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiErrorResponse(
	int status,
	String error,
	String errorCode,
	String message,
	String path,
	String correlationId,
	Instant timestamp,
	Map<String, String> validationErrors
) {
	public static ApiErrorResponse of(
		int status,
		String error,
		String errorCode,
		String message,
		String path,
		String correlationId
	) {
		return new ApiErrorResponse(
			status,
			error,
			errorCode,
			message,
			path,
			correlationId,
			Instant.now(),
			null
		);
	}

	public static ApiErrorResponse withValidation(
		int status,
		String error,
		String errorCode,
		String message,
		String path,
		String correlationId,
		Map<String, String> validationErrors
	) {
		return new ApiErrorResponse(
			status,
			error,
			errorCode,
			message,
			path,
			correlationId,
			Instant.now(),
			validationErrors
		);
	}
}
