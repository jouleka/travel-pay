package com.demo.travelexpensemanager.service.impl;

import com.demo.travelexpensemanager.dto.request.SignupRequest;
import com.demo.travelexpensemanager.dto.response.JwtResponse;
import com.demo.travelexpensemanager.dto.request.LoginRequest;
import com.demo.travelexpensemanager.dto.response.MessageResponse;
import com.demo.travelexpensemanager.model.Role;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.model.enums.RoleType;
import com.demo.travelexpensemanager.repository.RoleRepository;
import com.demo.travelexpensemanager.repository.UserRepository;
import com.demo.travelexpensemanager.security.jwt.JwtUtils;
import com.demo.travelexpensemanager.security.services.UserDetailsImpl;
import com.demo.travelexpensemanager.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
  Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles);
    }

    @Override
    public MessageResponse registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            return new MessageResponse("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return new MessageResponse("Error: Email is already in use!");
        }

        User user = new User(signupRequest.getUsername(),
                signupRequest.getEmail(),
                encoder.encode(signupRequest.getPassword()));

        // Public registration always creates an ordinary user. Privileged roles
        // are provisioned only by a trusted database administrator.
        if (signupRequest.getRole() != null && signupRequest.getRole().stream()
                .anyMatch(role -> !"user".equalsIgnoreCase(role))) {
            throw new org.springframework.security.access.AccessDeniedException("Public registration cannot assign privileged roles");
        }
        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        Set<Role> roles = new HashSet<>(Set.of(userRole));

        user.setRoles(roles);
        userRepository.save(user);

        return new MessageResponse("User registered successfully!");
    }
}
