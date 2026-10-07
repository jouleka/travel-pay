package com.demo.travelexpensemanager.service.impl;

import com.demo.travelexpensemanager.dto.request.TripRequest;
import com.demo.travelexpensemanager.dto.response.*;
import com.demo.travelexpensemanager.exception.ResourceNotFoundException;
import com.demo.travelexpensemanager.exception.UnauthorizedException;
import com.demo.travelexpensemanager.model.*;
import com.demo.travelexpensemanager.model.enums.TripStatus;
import com.demo.travelexpensemanager.repository.TripRepository;
import com.demo.travelexpensemanager.repository.RefundStatusRepository;
import com.demo.travelexpensemanager.service.TripService;
import com.demo.travelexpensemanager.security.TripAccessPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TripServiceImpl implements TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private RefundStatusRepository refundStatusRepository;

    @Override
    @Transactional
    public TripResponse createTrip(TripRequest tripRequest, User currentUser) {
        Trip trip = new Trip();
        trip.setName(tripRequest.getName());
        trip.setStartDate(tripRequest.getStartDate());
        trip.setEndDate(tripRequest.getEndDate());
        trip.setStatus(TripStatus.DRAFT);
        trip.setUser(currentUser);

        Trip savedTrip = tripRepository.save(trip);
        return convertToTripResponse(savedTrip);
    }

    @Override
    public TripResponse getTripById(Long id, User currentUser) {
        Trip trip = findTripEntityById(id);

        validateTripAccess(trip, currentUser);

        return convertToTripResponse(trip);
    }

    @Override
    public List<TripResponse> getTripsByUser(User currentUser) {
        List<Trip> trips = tripRepository.findByUser(currentUser);
        return trips.stream()
                .map(this::convertToTripResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TripResponse updateTrip(Long id, TripRequest tripRequest, User currentUser) {
        Trip trip = findTripEntityById(id);

        validateTripEditAccess(trip, currentUser);

        trip.setName(tripRequest.getName());
        trip.setStartDate(tripRequest.getStartDate());
        trip.setEndDate(tripRequest.getEndDate());

        Trip updatedTrip = tripRepository.save(trip);
        return convertToTripResponse(updatedTrip);
    }

    @Override
    @Transactional
    public void deleteTrip(Long id, User currentUser) {
        Trip trip = findTripEntityById(id);

        validateTripEditAccess(trip, currentUser);

        tripRepository.delete(trip);
    }

    @Override
    @Transactional
    public TripResponse submitTripForApproval(Long id, User currentUser) {
        Trip trip = findTripEntityById(id);

        validateTripEditAccess(trip, currentUser);

        trip.setStatus(TripStatus.PENDING_APPROVAL);
        Trip updatedTrip = tripRepository.save(trip);

        return convertToTripResponse(updatedTrip);
    }

    @Override
    public Trip findTripEntityById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
    }

    private void validateTripAccess(Trip trip, User currentUser) {
        TripAccessPolicy.requireReadAccess(trip, currentUser);
    }

    private void validateTripEditAccess(Trip trip, User currentUser) {
        // Read privileges for approval/finance never grant ownership of another user's draft.
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You don't have permission to modify this trip");
        }

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new UnauthorizedException("Trip can only be edited when in DRAFT status");
        }
    }

    TripResponse convertToTripResponse(Trip trip) {
        TripResponse response = new TripResponse();
        response.setId(trip.getId());
        response.setName(trip.getName());
        response.setStartDate(trip.getStartDate());
        response.setEndDate(trip.getEndDate());
        response.setStatus(trip.getStatus());

        User user = trip.getUser();
        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
        response.setUser(new UserResponse(user.getId(), user.getUsername(), user.getEmail(), roles));

        List<ExpenseResponse> expenseResponses = new ArrayList<>();
        if (trip.getExpenses() != null) {
            for (Expense expense : trip.getExpenses()) {
                ExpenseResponse expenseResponse;

                switch (expense.getType()) {
                    case CAR_RENTAL:
                        expenseResponse = getCarRentalResponse((CarRental) expense);
                        break;
                    case HOTEL:
                        Hotel hotel = (Hotel) expense;
                        HotelResponse hotelResponse = new HotelResponse();
                        hotelResponse.setHotelName(hotel.getHotelName());
                        hotelResponse.setLocation(hotel.getLocation());
                        hotelResponse.setCheckInDate(hotel.getCheckInDate());
                        hotelResponse.setCheckOutDate(hotel.getCheckOutDate());
                        expenseResponse = hotelResponse;
                        break;
                    case FLIGHT:
                        expenseResponse = getFlightResponse((Flight) expense);
                        break;
                    case TAXI:
                        Taxi taxi = (Taxi) expense;
                        TaxiResponse taxiResponse = new TaxiResponse();
                        taxiResponse.setFromLocation(taxi.getFromLocation());
                        taxiResponse.setToLocation(taxi.getToLocation());
                        taxiResponse.setTime(taxi.getTime());
                        expenseResponse = taxiResponse;
                        break;
                    default:
                        expenseResponse = new ExpenseResponse();
                }

                expenseResponse.setId(expense.getId());
                expenseResponse.setType(expense.getType());
                expenseResponse.setTotalPrice(expense.getTotalPrice());
                expenseResponse.setCreatedAt(expense.getCreatedAt());

                expenseResponses.add(expenseResponse);
            }
        }
        response.setExpenses(expenseResponses);
        response.setTotalExpenses(trip.calculateTotalExpenses());

        if (trip.getApprovalNotes() != null && !trip.getApprovalNotes().isEmpty()) {
            List<ApprovalNoteResponse> approvalNoteResponses = trip.getApprovalNotes().stream()
                    .map(note -> {
                        ApprovalNoteResponse noteResponse = new ApprovalNoteResponse();
                        noteResponse.setId(note.getId());
                        noteResponse.setNote(note.getNote());
                        noteResponse.setCreatedAt(note.getCreatedAt());
                        User approver = note.getApprover();
                        List<String> approverRoles = approver.getRoles().stream()
                                .map(role -> role.getName().name())
                                .collect(Collectors.toList());
                        noteResponse.setApprover(new UserResponse(
                                approver.getId(), 
                                approver.getUsername(), 
                                approver.getEmail(), 
                                approverRoles
                        ));
                        return noteResponse;
                    })
                    .collect(Collectors.toList());
            response.setApprovalNotes(approvalNoteResponses);
        }

        if (trip.getStatus() == TripStatus.APPROVED) {
            Optional<RefundStatus> refundStatusOpt = refundStatusRepository.findByTrip(trip);
            if (refundStatusOpt.isPresent()) {
                RefundStatus refundStatus = refundStatusOpt.get();
                RefundStatusResponse refundStatusResponse = new RefundStatusResponse();
                refundStatusResponse.setId(refundStatus.getId());
                refundStatusResponse.setStatus(refundStatus.getStatus());
                refundStatusResponse.setUpdatedAt(refundStatus.getUpdatedAt());
                
                User financeUser = refundStatus.getFinanceUser();
                if (financeUser != null) {
                    List<String> financeUserRoles = financeUser.getRoles().stream()
                            .map(role -> role.getName().name())
                            .collect(Collectors.toList());
                    refundStatusResponse.setFinanceUser(new UserResponse(
                            financeUser.getId(), 
                            financeUser.getUsername(), 
                            financeUser.getEmail(), 
                            financeUserRoles
                    ));
                }
                
                response.setRefundStatus(refundStatusResponse);
            }
        }

        return response;
    }

    private static FlightResponse getFlightResponse(Flight expense) {
        FlightResponse flightResponse = new FlightResponse();
        flightResponse.setAirline(expense.getAirline());
        flightResponse.setDepartureLocation(expense.getDepartureLocation());
        flightResponse.setArrivalLocation(expense.getArrivalLocation());
        flightResponse.setDepartureTime(expense.getDepartureTime());
        flightResponse.setArrivalTime(expense.getArrivalTime());
        return flightResponse;
    }

    private static CarRentalResponse getCarRentalResponse(CarRental expense) {
        CarRentalResponse carResponse = new CarRentalResponse();
        carResponse.setCarName(expense.getCarName());
        carResponse.setPickupTime(expense.getPickupTime());
        carResponse.setDropTime(expense.getDropTime());
        carResponse.setPickupLocation(expense.getPickupLocation());
        carResponse.setDropLocation(expense.getDropLocation());
        return carResponse;
    }
}
