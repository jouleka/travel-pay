package com.demo.travelexpensemanager.controller;

import com.demo.travelexpensemanager.dto.request.ApprovalRequest;
import com.demo.travelexpensemanager.dto.response.TripResponse;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.repository.UserRepository;
import com.demo.travelexpensemanager.security.services.UserDetailsImpl;
import com.demo.travelexpensemanager.service.ApproverService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/approver")
public class ApproverController {

    @Autowired
    private ApproverService approverService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/trips/pending")
    @PreAuthorize("hasRole('APPROVER')")
    public ResponseEntity<List<TripResponse>> getPendingTrips() {
        User currentUser = getCurrentUser();
        List<TripResponse> response = approverService.getPendingTrips(currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trips/{tripId}")
    @PreAuthorize("hasRole('APPROVER')")
    public ResponseEntity<TripResponse> getTripForApproval(@PathVariable Long tripId) {
        User currentUser = getCurrentUser();
        TripResponse response = approverService.getTripForApproval(tripId, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trips/{tripId}/approve")
    @PreAuthorize("hasRole('APPROVER')")
    public ResponseEntity<TripResponse> approveTrip(@PathVariable Long tripId, @Valid @RequestBody ApprovalRequest request) {
        User currentUser = getCurrentUser();
        TripResponse response;
        
        if (request.getApproved()) {
            response = approverService.approveTrip(tripId, request, currentUser);
        } else {
            response = approverService.rejectTrip(tripId, request, currentUser);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trips/{tripId}/reject")
    @PreAuthorize("hasRole('APPROVER')")
    public ResponseEntity<TripResponse> rejectTrip(@PathVariable Long tripId, @Valid @RequestBody ApprovalRequest request) {
        User currentUser = getCurrentUser();
        request.setApproved(false); // Ensure it's rejected regardless of what was sent
        TripResponse response = approverService.rejectTrip(tripId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
