package com.demo.travelexpensemanager.controller;

import com.demo.travelexpensemanager.dto.request.LoginRequest;
import com.demo.travelexpensemanager.dto.request.SignupRequest;
import com.demo.travelexpensemanager.dto.response.JwtResponse;
import com.demo.travelexpensemanager.dto.response.MessageResponse;
import com.demo.travelexpensemanager.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    public ResponseEntity<MessageResponse> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        MessageResponse response = authService.registerUser(signupRequest);
        return ResponseEntity.ok(response);
    }
}
