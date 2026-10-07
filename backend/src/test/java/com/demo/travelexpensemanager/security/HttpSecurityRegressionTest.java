package com.demo.travelexpensemanager.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "spring.datasource.password=", "spring.datasource.url=jdbc:h2:mem:travelpay-security;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
class HttpSecurityRegressionTest {
    @Autowired MockMvc mvc;
    @Test void protectedTripsRequireAuthenticationAndRetainFrameProtection() throws Exception {
        mvc.perform(get("/trips")).andExpect(status().isUnauthorized()).andExpect(header().string("X-Frame-Options", "SAMEORIGIN"));
    }
    @Test void rejectsUntrustedCrossOriginPreflight() throws Exception {
        mvc.perform(options("/auth/signin").header("Origin", "https://attacker.example").header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
    @Test void acceptsTheConfiguredFrontendOriginWithoutCredentialedWildcardCors() throws Exception {
        mvc.perform(options("/auth/signin").header("Origin", "http://localhost:4200").header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }
    @Test void publicSignupCannotGrantFinanceAuthority() throws Exception {
        mvc.perform(post("/auth/signup").contentType("application/json")
                .content("{\"username\":\"attacker\",\"email\":\"attacker@example.com\",\"password\":\"test-only-password\",\"role\":[\"finance\"]}"))
                .andExpect(status().isForbidden());
    }
}
