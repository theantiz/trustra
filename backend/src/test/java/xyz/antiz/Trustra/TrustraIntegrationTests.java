package xyz.antiz.Trustra;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.ScoringConfigRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustExplanationRepo;
import xyz.antiz.Trustra.repo.TrustScoreHistoryRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;
import xyz.antiz.Trustra.service.SimulationService;

@SpringBootTest
@AutoConfigureMockMvc
class TrustraIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private SimulationService simulationService;

	@Autowired
	private TrustExplanationRepo trustExplanationRepo;

	@Autowired
	private TrustScoreHistoryRepo trustScoreHistoryRepo;

	@Autowired
	private AbuseFlagRepo abuseFlagRepo;

	@Autowired
	private FeedbackRepo feedbackRepo;

	@Autowired
	private TransactionRepo transactionRepo;

	@Autowired
	private TrustScoreRepo trustScoreRepo;

	@Autowired
	private ScoringConfigRepo scoringConfigRepo;

	@Autowired
	private org.springframework.cache.CacheManager cacheManager;

	@Autowired
	private xyz.antiz.Trustra.service.TrustEngineService trustEngineService;

	@BeforeEach
	void cleanDatabase() {
		trustExplanationRepo.deleteAll();
		trustScoreHistoryRepo.deleteAll();
		abuseFlagRepo.deleteAll();
		feedbackRepo.deleteAll();
		transactionRepo.deleteAll();
		trustScoreRepo.deleteAll();
		scoringConfigRepo.deleteAll();
		if (cacheManager != null) {
			org.springframework.cache.Cache cache = cacheManager.getCache("trustScores");
			if (cache != null) {
				cache.clear();
			}
		}
	}

	@Test
	void transactionAndFeedbackFlowRecalculatesTrustAndStoresExplanations() throws Exception {
		mockMvc.perform(post("/api/transactions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "bob",
					  "amount": 125.50
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.receiverId").value("bob"))
			.andExpect(jsonPath("$.status").value("SUCCESS"));

		mockMvc.perform(post("/api/feedback")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "fromUserId": "alice",
					  "toUserId": "bob",
					  "rating": 5,
					  "type": "POSITIVE",
					  "comment": "Great counterparty"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.toUserId").value("bob"))
			.andExpect(jsonPath("$.rating").value(5));

		mockMvc.perform(get("/api/trust/bob"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value("bob"))
			.andExpect(jsonPath("$.score").value(greaterThan(80.0)))
			.andExpect(jsonPath("$.trustLevel").value("HIGH"))
			.andExpect(jsonPath("$.averageRating").value(5.0));

		mockMvc.perform(get("/api/trust/bob/explanations"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[*].factor", hasItem("SUCCESS_RATE")))
			.andExpect(jsonPath("$[*].factor", hasItem("FEEDBACK_RATING")))
			.andExpect(jsonPath("$[*].factor", hasItem("NETWORK_TRUST")));

		mockMvc.perform(get("/api/trust/bob/history"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(greaterThan(0))))
			.andExpect(jsonPath("$[0].userId").value("bob"));

		mockMvc.perform(get("/api/network/bob"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].userId").value("alice"))
			.andExpect(jsonPath("$[0].trustScore").value(50.0));
	}

	@Test
	void idempotencyKeyPreventsDuplicateTransactions() throws Exception {
		String idempotencyKey = "tx-idem-" + UUID.randomUUID();

		MvcResult firstCall = mockMvc.perform(post("/api/transactions")
				.header("Idempotency-Key", idempotencyKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "bob",
					  "amount": 250.00
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.idempotencyKey").value(idempotencyKey))
			.andReturn();

		String firstId = objectMapper.readTree(firstCall.getResponse().getContentAsString()).get("id").asText();

		// Exact replay returns identical transaction
		mockMvc.perform(post("/api/transactions")
				.header("Idempotency-Key", idempotencyKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "bob",
					  "amount": 250.00
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(firstId));

		// Conflicting payload with same idempotency key fails with 409 Conflict
		mockMvc.perform(post("/api/transactions")
				.header("Idempotency-Key", idempotencyKey)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "bob",
					  "amount": 999.00
					}
					"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.errorCode").value("DUPLICATE_IDEMPOTENCY_KEY"));

		assertEquals(1, transactionRepo.count());
	}

	@Test
	void adminAuthenticationAndDynamicScoringWeightConfiguration() throws Exception {
		// 1. Authenticate as admin to get JWT
		MvcResult authResult = mockMvc.perform(post("/api/auth/token")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "username": "admin",
					  "password": "admin123"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.token").isString())
			.andReturn();

		JsonNode authJson = objectMapper.readTree(authResult.getResponse().getContentAsString());
		String adminToken = authJson.get("token").asText();
		assertNotNull(adminToken);

		// 2. Access admin config without token fails with 401 or 403
		mockMvc.perform(get("/api/admin/config"))
			.andExpect(status().isForbidden());

		// 3. Access admin config with JWT succeeds
		mockMvc.perform(get("/api/admin/config")
				.header("Authorization", "Bearer " + adminToken))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.successWeight").value(50.0))
			.andExpect(jsonPath("$.disputeWeight").value(30.0));

		// 4. Update admin weights
		mockMvc.perform(put("/api/admin/config")
				.header("Authorization", "Bearer " + adminToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "successWeight": 60.0,
					  "disputeWeight": 25.0,
					  "feedbackWeight": 15.0,
					  "networkWeight": 20.0,
					  "maxInactivityPenalty": 15.0,
					  "negativeFeedbackPenalty": 3.0,
					  "scamReportPenalty": 10.0,
					  "spikePenalty": 10.0,
					  "fakeFeedbackPenalty": 15.0,
					  "clusterPenalty": 20.0
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.successWeight").value(60.0))
			.andExpect(jsonPath("$.updatedBy").value("admin"));
	}

	@Test
	void recalculationPreservesSeededBaselineWhenNoActivityExists() throws Exception {
		TrustScore trustScore = new TrustScore();
		trustScore.setUserId("seeded-demo");
		trustScore.setScore(72.5);
		trustScore.setSuccessRate(91.0);
		trustScore.setDisputeRate(2.0);
		trustScore.setAverageRating(4.6);
		trustScore.setLastActivityAt(Instant.now().minusSeconds(5 * 24 * 60 * 60L));
		trustScoreRepo.save(trustScore);

		mockMvc.perform(post("/api/trust/seeded-demo/recalculate"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value("seeded-demo"))
			.andExpect(jsonPath("$.score").value(72.5))
			.andExpect(jsonPath("$.successRate").value(91.0))
			.andExpect(jsonPath("$.disputeRate").value(2.0))
			.andExpect(jsonPath("$.averageRating").value(4.6));

		mockMvc.perform(get("/api/trust/seeded-demo/explanations"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[*].factor", hasItem("BASELINE_SCORE")));
	}

	@Test
	void mockUserBaseInitializationCreatesHundredUsersForDemoStats() {
		simulationService.initializeMockUserBase();

		assertEquals(100, trustScoreRepo.count());
		assertEquals(100, simulationService.getStats().totalUsers());
	}

	@Test
	void getTransactionByIdReturnsTransactionResponseAndHandlesNotFound() throws Exception {
		MvcResult result = mockMvc.perform(post("/api/transactions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "tx-sender-1",
					  "receiverId": "tx-receiver-1",
					  "amount": 199.99,
					  "currency": "USD"
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").isNotEmpty())
			.andExpect(jsonPath("$.status").value("SUCCESS"))
			.andReturn();

		String txId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

		// Fetch existing transaction
		mockMvc.perform(get("/api/transactions/" + txId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(txId))
			.andExpect(jsonPath("$.senderId").value("tx-sender-1"))
			.andExpect(jsonPath("$.receiverId").value("tx-receiver-1"))
			.andExpect(jsonPath("$.amount").value(199.99))
			.andExpect(jsonPath("$.currency").value("USD"))
			.andExpect(jsonPath("$.status").value("SUCCESS"))
			.andExpect(jsonPath("$.createdAt").isNotEmpty());

		// 404 for non-existent UUID
		UUID nonExistentId = UUID.randomUUID();
		mockMvc.perform(get("/api/transactions/" + nonExistentId))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
	}

	@Test
	void disputeTransactionTransitionsToDisputeAndRecalculatesTrustWithDisputeEvent() throws Exception {
		// 1. Create a transaction
		MvcResult result = mockMvc.perform(post("/api/transactions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "charlie",
					  "amount": 500.00
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("SUCCESS"))
			.andReturn();

		String txId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

		// 2. Dispute the transaction
		mockMvc.perform(post("/api/transactions/" + txId + "/dispute"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(txId))
			.andExpect(jsonPath("$.status").value("DISPUTE"));

		// 3. Verify GET returns DISPUTE status
		mockMvc.perform(get("/api/transactions/" + txId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DISPUTE"));

		// 4. Verify receiver trust score was recalculated with DISPUTE_EVENT
		mockMvc.perform(get("/api/trust/charlie"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.userId").value("charlie"))
			.andExpect(jsonPath("$.disputeRate").value(100.0));

		mockMvc.perform(get("/api/trust/charlie/history"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].triggerReason").value("DISPUTE_EVENT"))
			.andExpect(jsonPath("$[0].disputeRate").value(100.0));

		// 5. 404 for non-existent ID
		UUID nonExistentId = UUID.randomUUID();
		mockMvc.perform(post("/api/transactions/" + nonExistentId + "/dispute"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
	}

	@Test
	void refundTransactionTransitionsStatusToRefundedAndHandlesNotFound() throws Exception {
		// 1. Create a transaction
		MvcResult result = mockMvc.perform(post("/api/transactions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "dave",
					  "amount": 75.00
					}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("SUCCESS"))
			.andReturn();

		String txId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

		// 2. Refund the transaction
		mockMvc.perform(post("/api/transactions/" + txId + "/refund"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(txId))
			.andExpect(jsonPath("$.status").value("REFUNDED"));

		// 3. Verify GET returns REFUNDED status
		mockMvc.perform(get("/api/transactions/" + txId))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("REFUNDED"));

		// 4. 404 for non-existent ID
		UUID nonExistentId = UUID.randomUUID();
		mockMvc.perform(post("/api/transactions/" + nonExistentId + "/refund"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
	}

	@Test
	void cachingLayerStoresAndInvalidatesTrustScoreOnDisputeAndNewTransactions() throws Exception {
		assertNotNull(cacheManager);
		org.springframework.cache.Cache cache = cacheManager.getCache("trustScores");
		assertNotNull(cache);

		// Initial get loads into cache
		TrustScore initial = trustEngineService.get("cache-user");
		assertNotNull(initial);
		assertNotNull(cache.get("cache-user"));

		// Dispute causes recalculation and updates cache
		MvcResult result = mockMvc.perform(post("/api/transactions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{
					  "senderId": "alice",
					  "receiverId": "cache-user",
					  "amount": 200.00
					}
					"""))
			.andExpect(status().isOk())
			.andReturn();

		String txId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

		// Dispute transaction
		mockMvc.perform(post("/api/transactions/" + txId + "/dispute"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DISPUTE"));

		// Cached entry should exist and reflect the dispute
		TrustScore cachedScore = cache.get("cache-user", TrustScore.class);
		assertNotNull(cachedScore);
		assertEquals(100.0, cachedScore.getDisputeRate());
	}
}
