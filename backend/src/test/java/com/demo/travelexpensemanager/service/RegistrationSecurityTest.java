package com.demo.travelexpensemanager.service;

import com.demo.travelexpensemanager.dto.request.SignupRequest;
import com.demo.travelexpensemanager.model.Role;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.model.enums.RoleType;
import com.demo.travelexpensemanager.repository.RoleRepository;
import com.demo.travelexpensemanager.repository.UserRepository;
import com.demo.travelexpensemanager.service.impl.AuthServiceImpl;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationSecurityTest {
    @Mock UserRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder encoder;
    @InjectMocks AuthServiceImpl service;

    private SignupRequest request(Set<String> requestedRoles) {
        SignupRequest request = new SignupRequest();
        request.setUsername("traveler"); request.setEmail("user@example.com");
        request.setPassword("test-only-password"); request.setRole(requestedRoles);
        return request;
    }
    @Test void rejectsApproverAndFinanceSelfAssignmentWithoutSaving() {
        assertThrows(AccessDeniedException.class, () -> service.registerUser(request(Set.of("approver"))));
        assertThrows(AccessDeniedException.class, () -> service.registerUser(request(Set.of("finance"))));
        verify(users, never()).save(any());
    }
    @Test void publicRegistrationAlwaysGrantsOnlyOrdinaryUser() {
        when(roles.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(new Role(RoleType.ROLE_USER)));
        when(encoder.encode("test-only-password")).thenReturn("hashed-test-password");
        service.registerUser(request(Set.of()));
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals(Set.of(new Role(RoleType.ROLE_USER)), saved.getValue().getRoles());
        assertEquals("hashed-test-password", saved.getValue().getPassword());
    }
}
