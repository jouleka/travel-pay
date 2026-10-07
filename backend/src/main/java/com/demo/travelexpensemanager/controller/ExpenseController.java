package com.demo.travelexpensemanager.controller;

import com.demo.travelexpensemanager.dto.request.CarRentalRequest;
import com.demo.travelexpensemanager.dto.request.FlightRequest;
import com.demo.travelexpensemanager.dto.request.HotelRequest;
import com.demo.travelexpensemanager.dto.request.TaxiRequest;
import com.demo.travelexpensemanager.dto.response.ExpenseResponse;
import com.demo.travelexpensemanager.dto.response.MessageResponse;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.repository.UserRepository;
import com.demo.travelexpensemanager.security.services.UserDetailsImpl;
import com.demo.travelexpensemanager.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/trips/{tripId}/car-rentals")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> addCarRental(@PathVariable Long tripId, @Valid @RequestBody CarRentalRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.addCarRental(tripId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trips/{tripId}/hotels")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> addHotel(@PathVariable Long tripId, @Valid @RequestBody HotelRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.addHotel(tripId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trips/{tripId}/flights")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> addFlight(@PathVariable Long tripId, @Valid @RequestBody FlightRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.addFlight(tripId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trips/{tripId}/taxis")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> addTaxi(@PathVariable Long tripId, @Valid @RequestBody TaxiRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.addTaxi(tripId, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'APPROVER', 'FINANCE')")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.getExpenseById(id, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/car-rentals/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> updateCarRental(@PathVariable Long id, @Valid @RequestBody CarRentalRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.updateCarRental(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/hotels/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> updateHotel(@PathVariable Long id, @Valid @RequestBody HotelRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.updateHotel(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/flights/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.updateFlight(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/taxis/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ExpenseResponse> updateTaxi(@PathVariable Long id, @Valid @RequestBody TaxiRequest request) {
        User currentUser = getCurrentUser();
        ExpenseResponse response = expenseService.updateTaxi(id, request, currentUser);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MessageResponse> deleteExpense(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        expenseService.deleteExpense(id, currentUser);
        return ResponseEntity.ok(new MessageResponse("Expense deleted successfully"));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
