package xyz.antiz.Trustra.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.entity.AbuseFlag;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;

@RestController
@RequestMapping("/api/abuse")
public class AbuseController {

	private final AbuseFlagRepo abuseFlagRepo;

	public AbuseController(AbuseFlagRepo abuseFlagRepo) {
		this.abuseFlagRepo = abuseFlagRepo;
	}

	@GetMapping("/{userId}")
	public List<AbuseFlag> getByUser(@PathVariable String userId) {
		return abuseFlagRepo.findByUserIdOrderByCreatedAtDesc(userId);
	}
}
