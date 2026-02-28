package xyz.antiz.Trustra.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import xyz.antiz.Trustra.entity.AbuseFlag;

public interface AbuseFlagRepo extends JpaRepository<AbuseFlag, UUID> {

	List<AbuseFlag> findByUserIdOrderByCreatedAtDesc(String userId);

	void deleteByUserId(String userId);
}
