package xyz.antiz.Trustra.repo;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import xyz.antiz.Trustra.entity.Feedback;

public interface FeedbackRepo extends JpaRepository<Feedback, UUID> {

	long countByToUserId(String toUserId);

	long countByToUserIdAndType(String toUserId, String type);

	@Query("""
		select count(f)
		from Feedback f
		where f.toUserId = :userId
		  and f.createdAt >= :since
	""")
	long countFeedbackReceivedSince(@Param("userId") String userId, @Param("since") Instant since);

	@Query("select coalesce(avg(f.rating), 0) from Feedback f where f.toUserId = :toUserId")
	double averageRatingByToUserId(@Param("toUserId") String toUserId);
}
