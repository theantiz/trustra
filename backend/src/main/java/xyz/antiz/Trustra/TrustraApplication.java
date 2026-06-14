package xyz.antiz.Trustra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrustraApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrustraApplication.class, args);
	}

}
