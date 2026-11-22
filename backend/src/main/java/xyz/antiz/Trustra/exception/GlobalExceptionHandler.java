package xyz.antiz.Trustra.exception;

import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import xyz.antiz.Trustra.dto.ApiErrorResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
	private static final String CORRELATION_ID_KEY = "correlationId";

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidationExceptions(
		MethodArgumentNotValidException ex,
		HttpServletRequest request
	) {
		Map<String, String> errors = new HashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			errors.put(error.getField(), error.getDefaultMessage());
		}

		ApiErrorResponse errorResponse = ApiErrorResponse.withValidation(
			HttpStatus.BAD_REQUEST.value(),
			HttpStatus.BAD_REQUEST.getReasonPhrase(),
			"VALIDATION_FAILED",
			"Validation failed for one or more fields",
			request.getRequestURI(),
			getCorrelationId(),
			errors
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
		ResourceNotFoundException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.NOT_FOUND.value(),
			HttpStatus.NOT_FOUND.getReasonPhrase(),
			"RESOURCE_NOT_FOUND",
			ex.getMessage(),
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
	}

	@ExceptionHandler(DuplicateIdempotencyException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateIdempotency(
		DuplicateIdempotencyException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.CONFLICT.value(),
			HttpStatus.CONFLICT.getReasonPhrase(),
			"DUPLICATE_IDEMPOTENCY_KEY",
			ex.getMessage(),
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
	}

	@ExceptionHandler(InvalidOperationException.class)
	public ResponseEntity<ApiErrorResponse> handleInvalidOperation(
		InvalidOperationException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.BAD_REQUEST.value(),
			HttpStatus.BAD_REQUEST.getReasonPhrase(),
			"INVALID_OPERATION",
			ex.getMessage(),
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ApiErrorResponse> handleResponseStatus(
		ResponseStatusException ex,
		HttpServletRequest request
	) {
		int statusCode = ex.getStatusCode().value();
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			statusCode,
			ex.getReason() != null ? ex.getReason() : "Request Failed",
			"REQUEST_FAILED",
			ex.getReason() != null ? ex.getReason() : ex.getMessage(),
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(statusCode).body(errorResponse);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ApiErrorResponse> handleBadCredentials(
		BadCredentialsException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.UNAUTHORIZED.value(),
			HttpStatus.UNAUTHORIZED.getReasonPhrase(),
			"INVALID_CREDENTIALS",
			"Invalid username or password",
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiErrorResponse> handleAccessDenied(
		AccessDeniedException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.FORBIDDEN.value(),
			HttpStatus.FORBIDDEN.getReasonPhrase(),
			"ACCESS_DENIED",
			"You do not have permission to access this resource",
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
	}

	@ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatch(
		org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex,
		HttpServletRequest request
	) {
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.BAD_REQUEST.value(),
			HttpStatus.BAD_REQUEST.getReasonPhrase(),
			"INVALID_ARGUMENT_TYPE",
			"Invalid parameter '" + ex.getName() + "': " + ex.getValue(),
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleGeneralException(
		Exception ex,
		HttpServletRequest request
	) {
		log.error("Unhandled exception for URI {}: ", request.getRequestURI(), ex);
		ApiErrorResponse errorResponse = ApiErrorResponse.of(
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
			"INTERNAL_SERVER_ERROR",
			"An unexpected error occurred. Please contact support with the correlation ID.",
			request.getRequestURI(),
			getCorrelationId()
		);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	private String getCorrelationId() {
		String correlationId = MDC.get(CORRELATION_ID_KEY);
		return correlationId != null ? correlationId : "N/A";
	}
}
