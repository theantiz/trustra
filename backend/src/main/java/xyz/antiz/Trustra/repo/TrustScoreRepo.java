package xyz.antiz.Trustra.repo;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import xyz.antiz.Trustra.entity.TrustScore;

public interface TrustScoreRepo extends JpaRepository<TrustScore, Long> {

	Optional<TrustScore> findByUserId(String userId);

	List<TrustScore> findByUserIdIn(Collection<String> userIds);
}
