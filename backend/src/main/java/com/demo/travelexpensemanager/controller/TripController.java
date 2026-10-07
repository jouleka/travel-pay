package com.demo.travelexpensemanager.controller;

import com.demo.travelexpensemanager.dto.request.TripRequest;
import com.demo.travelexpensemanager.dto.response.MessageResponse;
import com.demo.travelexpensemanager.dto.response.TripResponse;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.repository.UserRepository;
import com.demo.travelexpensemanager.security.services.UserDetailsImpl;
import com.demo.travelexpensemanager.service.TripService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TripResponse> createTrip(@Valid @RequestBody TripRequest tripRequest) {
        User currentUser = getCurrentUser();
        TripResponse response = tripService.createTrip(tripRequest, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'APPROVER', 'FINANCE')")
    public ResponseEntity<TripResponse> getTripById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        TripResponse response = tripService.getTripById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<TripResponse>> getMyTrips() {
        User currentUser = getCurrentUser();
        List<TripResponse> response = tripService.getTripsByUser(currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable Long id, @Valid @RequestBody TripRequest tripRequest) {
        User currentUser = getCurrentUser();
        TripResponse response = tripService.updateTrip(id, tripRequest, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MessageResponse> deleteTrip(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        tripService.deleteTrip(id, currentUser);
        return ResponseEntity.ok(new MessageResponse("Trip deleted successfully"));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TripResponse> submitTripForApproval(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        TripResponse response = tripService.submitTripForApproval(id, currentUser);
        return ResponseEntity.ok(response);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
