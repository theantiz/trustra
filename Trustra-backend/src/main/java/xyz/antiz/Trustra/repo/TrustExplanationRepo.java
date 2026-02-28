package xyz.antiz.Trustra.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import xyz.antiz.Trustra.entity.TrustExplanation;

public interface TrustExplanationRepo extends JpaRepository<TrustExplanation, Long> {

	void deleteByUserId(String userId);

	List<TrustExplanation> findByUserIdOrderByCalculatedAtDescIdDesc(String userId);
}
