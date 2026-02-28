package xyz.antiz.Trustra.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import xyz.antiz.Trustra.service.TrustEngineService;
import xyz.antiz.Trustra.service.TrustEngineService.NetworkCounterpartyView;

@RestController
@RequestMapping("/api/network")
public class NetworkController {

	private final TrustEngineService trustEngineService;

	public NetworkController(TrustEngineService trustEngineService) {
		this.trustEngineService = trustEngineService;
	}

	@GetMapping("/{userId}")
	public List<NetworkCounterpartyView> getNetwork(@PathVariable String userId) {
		return trustEngineService.getNetworkView(userId);
	}
}
