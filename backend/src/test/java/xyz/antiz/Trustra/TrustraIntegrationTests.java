package xyz.antiz.Trustra;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import xyz.antiz.Trustra.entity.TrustScore;
import xyz.antiz.Trustra.repo.AbuseFlagRepo;
import xyz.antiz.Trustra.repo.FeedbackRepo;
import xyz.antiz.Trustra.repo.TransactionRepo;
import xyz.antiz.Trustra.repo.TrustExplanationRepo;
import xyz.antiz.Trustra.repo.TrustScoreRepo;
import xyz.antiz.Trustra.service.SimulationService;

@SpringBootTest
@AutoConfigureMockMvc
class TrustraIntegrationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private SimulationService simulationService;

	@Autowired
	private TrustExplanationRepo trustExplanationRepo;

	@Autowired
	private AbuseFlagRepo abuseFlagRepo;

	@Autowired
	private FeedbackRepo feedbackRepo;

	@Autowired
	private TransactionRepo transactionRepo;

	@Autowired
	private TrustScoreRepo trustScoreRepo;

	@BeforeEach
	void cleanDatabase() {
		trustExplanationRepo.deleteAll();
		abuseFlagRepo.deleteAll();
		feedbackRepo.deleteAll();
		transactionRepo.deleteAll();
		trustScoreRepo.deleteAll();
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
			.andExpect(jsonPath("$.averageRating").value(5.0));

		mockMvc.perform(get("/api/trust/bob/explanations"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[*].factor", hasItem("SUCCESS_RATE")))
			.andExpect(jsonPath("$[*].factor", hasItem("FEEDBACK_RATING")))
			.andExpect(jsonPath("$[*].factor", hasItem("NETWORK_TRUST")));

		mockMvc.perform(get("/api/network/bob"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].userId").value("alice"))
			.andExpect(jsonPath("$[0].trustScore").value(50.0));
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
}
