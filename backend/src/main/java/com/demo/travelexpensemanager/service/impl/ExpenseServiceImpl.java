package com.demo.travelexpensemanager.service.impl;
import com.demo.travelexpensemanager.security.TripAccessPolicy;

import com.demo.travelexpensemanager.dto.request.CarRentalRequest;
import com.demo.travelexpensemanager.dto.request.FlightRequest;
import com.demo.travelexpensemanager.dto.request.HotelRequest;
import com.demo.travelexpensemanager.dto.request.TaxiRequest;
import com.demo.travelexpensemanager.dto.response.*;
import com.demo.travelexpensemanager.model.*;
import com.demo.travelexpensemanager.model.enums.ExpenseType;
import com.demo.travelexpensemanager.model.enums.TripStatus;
import com.demo.travelexpensemanager.repository.ExpenseRepository;
import com.demo.travelexpensemanager.service.ExpenseService;
import com.demo.travelexpensemanager.exception.ResourceNotFoundException;
import com.demo.travelexpensemanager.exception.UnauthorizedException;
import com.demo.travelexpensemanager.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExpenseServiceImpl implements ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private TripService tripService;

    @Override
    @Transactional
    public ExpenseResponse addCarRental(Long tripId, CarRentalRequest request, User currentUser) {
        Trip trip = tripService.findTripEntityById(tripId);

        validateExpenseAddAccess(trip, currentUser);

        CarRental carRental = new CarRental(
                request.getCarName(),
                request.getPickupTime(),
                request.getDropTime(),
                request.getPickupLocation(),
                request.getDropLocation(),
                request.getTotalPrice()
        );

        carRental.setTrip(trip);
        trip.addExpense(carRental);

        CarRental savedExpense = expenseRepository.save(carRental);
        return convertToCarRentalResponse(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse addHotel(Long tripId, HotelRequest request, User currentUser) {
        Trip trip = tripService.findTripEntityById(tripId);

        validateExpenseAddAccess(trip, currentUser);

        Hotel hotel = new Hotel(
                request.getHotelName(),
                request.getLocation(),
                request.getCheckInDate(),
                request.getCheckOutDate(),
                request.getTotalPrice()
        );

        hotel.setTrip(trip);
        trip.addExpense(hotel);

        Hotel savedExpense = expenseRepository.save(hotel);
        return convertToHotelResponse(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse addFlight(Long tripId, FlightRequest request, User currentUser) {
        Trip trip = tripService.findTripEntityById(tripId);

        validateExpenseAddAccess(trip, currentUser);

        Flight flight = new Flight(
                request.getAirline(),
                request.getDepartureLocation(),
                request.getArrivalLocation(),
                request.getDepartureTime(),
                request.getArrivalTime(),
                request.getTotalPrice()
        );

        flight.setTrip(trip);
        trip.addExpense(flight);

        Flight savedExpense = expenseRepository.save(flight);
        return convertToFlightResponse(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse addTaxi(Long tripId, TaxiRequest request, User currentUser) {
        Trip trip = tripService.findTripEntityById(tripId);

        validateExpenseAddAccess(trip, currentUser);

        Taxi taxi = new Taxi(
                request.getFromLocation(),
                request.getToLocation(),
                request.getTime(),
                request.getTotalPrice()
        );

        taxi.setTrip(trip);
        trip.addExpense(taxi);

        Taxi savedExpense = expenseRepository.save(taxi);
        return convertToTaxiResponse(savedExpense);
    }

    @Override
    public ExpenseResponse getExpenseById(Long id, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        validateExpenseAccess(expense.getTrip(), currentUser);

        return convertToExpenseResponse(expense);
    }

    @Override
    @Transactional
    public ExpenseResponse updateCarRental(Long id, CarRentalRequest request, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        if (expense.getType() != ExpenseType.CAR_RENTAL) {
            throw new IllegalArgumentException("Expense is not a car rental");
        }

        validateExpenseEditAccess(expense.getTrip(), currentUser);

        CarRental carRental = (CarRental) expense;
        carRental.setCarName(request.getCarName());
        carRental.setPickupTime(request.getPickupTime());
        carRental.setDropTime(request.getDropTime());
        carRental.setPickupLocation(request.getPickupLocation());
        carRental.setDropLocation(request.getDropLocation());
        carRental.setTotalPrice(request.getTotalPrice());

        CarRental updatedExpense = expenseRepository.save(carRental);
        return convertToCarRentalResponse(updatedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse updateHotel(Long id, HotelRequest request, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        if (expense.getType() != ExpenseType.HOTEL) {
            throw new IllegalArgumentException("Expense is not a hotel");
        }

        validateExpenseEditAccess(expense.getTrip(), currentUser);

        Hotel hotel = (Hotel) expense;
        hotel.setHotelName(request.getHotelName());
        hotel.setLocation(request.getLocation());
        hotel.setCheckInDate(request.getCheckInDate());
        hotel.setCheckOutDate(request.getCheckOutDate());
        hotel.setTotalPrice(request.getTotalPrice());

        Hotel updatedExpense = expenseRepository.save(hotel);
        return convertToHotelResponse(updatedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse updateFlight(Long id, FlightRequest request, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        if (expense.getType() != ExpenseType.FLIGHT) {
            throw new IllegalArgumentException("Expense is not a flight");
        }

        validateExpenseEditAccess(expense.getTrip(), currentUser);

        Flight flight = (Flight) expense;
        flight.setAirline(request.getAirline());
        flight.setDepartureLocation(request.getDepartureLocation());
        flight.setArrivalLocation(request.getArrivalLocation());
        flight.setDepartureTime(request.getDepartureTime());
        flight.setArrivalTime(request.getArrivalTime());
        flight.setTotalPrice(request.getTotalPrice());

        Flight updatedExpense = expenseRepository.save(flight);
        return convertToFlightResponse(updatedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse updateTaxi(Long id, TaxiRequest request, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        if (expense.getType() != ExpenseType.TAXI) {
            throw new IllegalArgumentException("Expense is not a taxi");
        }

        validateExpenseEditAccess(expense.getTrip(), currentUser);

        Taxi taxi = (Taxi) expense;
        taxi.setFromLocation(request.getFromLocation());
        taxi.setToLocation(request.getToLocation());
        taxi.setTime(request.getTime());
        taxi.setTotalPrice(request.getTotalPrice());

        Taxi updatedExpense = expenseRepository.save(taxi);
        return convertToTaxiResponse(updatedExpense);
    }

    @Override
    @Transactional
    public void deleteExpense(Long id, User currentUser) {
        Expense expense = findExpenseEntityById(id);

        validateExpenseEditAccess(expense.getTrip(), currentUser);

        expenseRepository.delete(expense);
    }

    private Expense findExpenseEntityById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
    }

    private void validateExpenseAccess(Trip trip, User currentUser) {
        TripAccessPolicy.requireReadAccess(trip, currentUser);
    }

    private void validateExpenseAddAccess(Trip trip, User currentUser) {
        validateExpenseAccess(trip, currentUser);

        if (!trip.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only the trip owner can add expenses");
        }

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new UnauthorizedException("Expenses can only be added when trip is in DRAFT status");
        }
    }

    private void validateExpenseEditAccess(Trip trip, User currentUser) {
        validateExpenseAccess(trip, currentUser);

        if (!trip.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Only the trip owner can edit expenses");
        }

        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new UnauthorizedException("Expenses can only be edited when trip is in DRAFT status");
        }
    }

    private ExpenseResponse convertToExpenseResponse(Expense expense) {
        switch (expense.getType()) {
            case CAR_RENTAL:
                return convertToCarRentalResponse((CarRental) expense);
            case HOTEL:
                return convertToHotelResponse((Hotel) expense);
            case FLIGHT:
                return convertToFlightResponse((Flight) expense);
            case TAXI:
                return convertToTaxiResponse((Taxi) expense);
            default:
                ExpenseResponse response = new ExpenseResponse();
                response.setId(expense.getId());
                response.setType(expense.getType());
                response.setTotalPrice(expense.getTotalPrice());
                response.setCreatedAt(expense.getCreatedAt());
                return response;
        }
    }

    private CarRentalResponse convertToCarRentalResponse(CarRental carRental) {
        CarRentalResponse response = new CarRentalResponse();
        response.setId(carRental.getId());
        response.setType(carRental.getType());
        response.setTotalPrice(carRental.getTotalPrice());
        response.setCreatedAt(carRental.getCreatedAt());
        response.setCarName(carRental.getCarName());
        response.setPickupTime(carRental.getPickupTime());
        response.setDropTime(carRental.getDropTime());
        response.setPickupLocation(carRental.getPickupLocation());
        response.setDropLocation(carRental.getDropLocation());

        response.setDetails(String.format("%s - %s to %s",
                carRental.getCarName(),
                carRental.getPickupLocation(),
                carRental.getDropLocation()));

        return response;
    }

    private HotelResponse convertToHotelResponse(Hotel hotel) {
        HotelResponse response = new HotelResponse();
        response.setId(hotel.getId());
        response.setType(hotel.getType());
        response.setTotalPrice(hotel.getTotalPrice());
        response.setCreatedAt(hotel.getCreatedAt());
        response.setHotelName(hotel.getHotelName());
        response.setLocation(hotel.getLocation());
        response.setCheckInDate(hotel.getCheckInDate());
        response.setCheckOutDate(hotel.getCheckOutDate());

        response.setDetails(String.format("%s - %s",
                hotel.getHotelName(),
                hotel.getLocation()));

        return response;
    }

    private FlightResponse convertToFlightResponse(Flight flight) {
        FlightResponse response = new FlightResponse();
        response.setId(flight.getId());
        response.setType(flight.getType());
        response.setTotalPrice(flight.getTotalPrice());
        response.setCreatedAt(flight.getCreatedAt());
        response.setAirline(flight.getAirline());
        response.setDepartureLocation(flight.getDepartureLocation());
        response.setArrivalLocation(flight.getArrivalLocation());
        response.setDepartureTime(flight.getDepartureTime());
        response.setArrivalTime(flight.getArrivalTime());

        response.setDetails(String.format("%s - %s to %s",
                flight.getAirline(),
                flight.getDepartureLocation(),
                flight.getArrivalLocation()));

        return response;
    }

    private TaxiResponse convertToTaxiResponse(Taxi taxi) {
        TaxiResponse response = new TaxiResponse();
        response.setId(taxi.getId());
        response.setType(taxi.getType());
        response.setTotalPrice(taxi.getTotalPrice());
        response.setCreatedAt(taxi.getCreatedAt());
        response.setFromLocation(taxi.getFromLocation());
        response.setToLocation(taxi.getToLocation());
        response.setTime(taxi.getTime());

        response.setDetails(String.format("%s to %s",
                taxi.getFromLocation(),
                taxi.getToLocation()));

        return response;
    }
}
