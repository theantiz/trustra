package xyz.antiz.Trustra.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI customOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Trustra API")
						.version("1.0.0")
						.description("Trustra is a real-time trust scoring engine that evaluates the reliability of users in digital payment systems using behavioral signals, transaction history, and feedback patterns.")
						.contact(new Contact()
								.name("Trustra Support")
								.email("support@trustra.xyz")));
	}
}
