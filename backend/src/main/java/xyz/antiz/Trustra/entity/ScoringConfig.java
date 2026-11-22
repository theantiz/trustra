package xyz.antiz.Trustra.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "scoring_configuration")
public class ScoringConfig {

	@Id
	@Column(name = "config_key", length = 50)
	private String configKey = "DEFAULT";

	@Column(name = "success_weight", nullable = false)
	private double successWeight = 50.0;

	@Column(name = "dispute_weight", nullable = false)
	private double disputeWeight = 30.0;

	@Column(name = "feedback_weight", nullable = false)
	private double feedbackWeight = 20.0;

	@Column(name = "network_weight", nullable = false)
	private double networkWeight = 30.0;

	@Column(name = "max_inactivity_penalty", nullable = false)
	private double maxInactivityPenalty = 20.0;

	@Column(name = "negative_feedback_penalty", nullable = false)
	private double negativeFeedbackPenalty = 2.0;

	@Column(name = "scam_report_penalty", nullable = false)
	private double scamReportPenalty = 5.0;

	@Column(name = "spike_penalty", nullable = false)
	private double spikePenalty = 8.0;

	@Column(name = "fake_feedback_penalty", nullable = false)
	private double fakeFeedbackPenalty = 12.0;

	@Column(name = "cluster_penalty", nullable = false)
	private double clusterPenalty = 15.0;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "updated_by", length = 100)
	private String updatedBy = "system";

	@PrePersist
	@PreUpdate
	void onSave() {
		updatedAt = Instant.now();
	}

	public String getConfigKey() {
		return configKey;
	}

	public void setConfigKey(String configKey) {
		this.configKey = configKey;
	}

	public double getSuccessWeight() {
		return successWeight;
	}

	public void setSuccessWeight(double successWeight) {
		this.successWeight = successWeight;
	}

	public double getDisputeWeight() {
		return disputeWeight;
	}

	public void setDisputeWeight(double disputeWeight) {
		this.disputeWeight = disputeWeight;
	}

	public double getFeedbackWeight() {
		return feedbackWeight;
	}

	public void setFeedbackWeight(double feedbackWeight) {
		this.feedbackWeight = feedbackWeight;
	}

	public double getNetworkWeight() {
		return networkWeight;
	}

	public void setNetworkWeight(double networkWeight) {
		this.networkWeight = networkWeight;
	}

	public double getMaxInactivityPenalty() {
		return maxInactivityPenalty;
	}

	public void setMaxInactivityPenalty(double maxInactivityPenalty) {
		this.maxInactivityPenalty = maxInactivityPenalty;
	}

	public double getNegativeFeedbackPenalty() {
		return negativeFeedbackPenalty;
	}

	public void setNegativeFeedbackPenalty(double negativeFeedbackPenalty) {
		this.negativeFeedbackPenalty = negativeFeedbackPenalty;
	}

	public double getScamReportPenalty() {
		return scamReportPenalty;
	}

	public void setScamReportPenalty(double scamReportPenalty) {
		this.scamReportPenalty = scamReportPenalty;
	}

	public double getSpikePenalty() {
		return spikePenalty;
	}

	public void setSpikePenalty(double spikePenalty) {
		this.spikePenalty = spikePenalty;
	}

	public double getFakeFeedbackPenalty() {
		return fakeFeedbackPenalty;
	}

	public void setFakeFeedbackPenalty(double fakeFeedbackPenalty) {
		this.fakeFeedbackPenalty = fakeFeedbackPenalty;
	}

	public double getClusterPenalty() {
		return clusterPenalty;
	}

	public void setClusterPenalty(double clusterPenalty) {
		this.clusterPenalty = clusterPenalty;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}
}
