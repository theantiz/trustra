package xyz.antiz.Trustra.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import xyz.antiz.Trustra.entity.TrustScoreHistory;

public interface TrustScoreHistoryRepo extends JpaRepository<TrustScoreHistory, Long> {

	List<TrustScoreHistory> findByUserIdOrderByRecordedAtDesc(String userId);

	void deleteByUserId(String userId);
}
