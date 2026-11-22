package xyz.antiz.Trustra.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import xyz.antiz.Trustra.entity.ScoringConfig;

public interface ScoringConfigRepo extends JpaRepository<ScoringConfig, String> {
}
