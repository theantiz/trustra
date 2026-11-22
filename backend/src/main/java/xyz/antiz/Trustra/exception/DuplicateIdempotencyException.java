package xyz.antiz.Trustra.exception;

public class DuplicateIdempotencyException extends RuntimeException {
	public DuplicateIdempotencyException(String message) {
		super(message);
	}
}
