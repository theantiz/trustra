package xyz.antiz.Trustra.repo;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import xyz.antiz.Trustra.entity.Transaction;

public interface TransactionRepo extends JpaRepository<Transaction, UUID> {

	long countByReceiverId(String receiverId);

	long countByReceiverIdAndStatus(String receiverId, String status);

	@Query("""
		select count(t)
		from Transaction t
		where (t.senderId = :userId or t.receiverId = :userId)
		  and t.createdAt >= :since
	""")
	long countTransactionsForUserSince(@Param("userId") String userId, @Param("since") Instant since);

	List<Transaction> findTop100BySenderIdOrReceiverIdOrderByCreatedAtDesc(String senderId, String receiverId);

	List<Transaction> findTop50BySenderIdOrReceiverIdOrderByCreatedAtDesc(String senderId, String receiverId);

	List<Transaction> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(String senderId, String receiverId);
}
