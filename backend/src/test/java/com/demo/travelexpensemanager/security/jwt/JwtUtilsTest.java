package com.demo.travelexpensemanager.security.jwt;

import com.demo.travelexpensemanager.security.services.UserDetailsImpl;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {
    private String key(byte value) {
        byte[] bytes = new byte[32];
        java.util.Arrays.fill(bytes, value);
        return Base64.getEncoder().encodeToString(bytes);
    }
    @Test void refusesMissingMalformedAndShortSecrets() {
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils(null, 60000));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils("", 60000));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils("not!base64", 60000));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils("c2hvcnQ=", 60000));
    }
    @Test void acceptsSignedTokensAndRejectsAnotherKey() {
        JwtUtils jwt = new JwtUtils(key((byte) 1), 60000);
        var user = new UserDetailsImpl(1L, "traveler", "user@example.com", "unused", List.of());
        String token = jwt.generateJwtToken(new UsernamePasswordAuthenticationToken(user, null));
        assertTrue(jwt.validateJwtToken(token));
        assertEquals("traveler", jwt.getUserNameFromJwtToken(token));
        assertFalse(new JwtUtils(key((byte) 2), 60000).validateJwtToken(token));
        assertFalse(jwt.validateJwtToken("malformed"));
    }
}
