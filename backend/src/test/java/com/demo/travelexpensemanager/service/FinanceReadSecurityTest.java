package com.demo.travelexpensemanager.service;

import com.demo.travelexpensemanager.exception.UnauthorizedException;
import com.demo.travelexpensemanager.model.*;
import com.demo.travelexpensemanager.model.enums.*;
import com.demo.travelexpensemanager.repository.*;
import com.demo.travelexpensemanager.service.impl.ExpenseServiceImpl;
import com.demo.travelexpensemanager.service.impl.TripServiceImpl;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceReadSecurityTest {
    @Mock TripRepository trips;
    @Mock RefundStatusRepository refunds;
    @Mock ExpenseRepository expenses;
    @InjectMocks TripServiceImpl tripService;
    @InjectMocks ExpenseServiceImpl expenseService;
    private User owner;
    private Trip trip;

    private User user(long id, RoleType role) {
        User user = new User();
        user.setId(id);
        user.setRoles(Set.of(new Role(role)));
        return user;
    }
    private void fixture(TripStatus status) {
        owner = user(1L, RoleType.ROLE_USER);
        trip = new Trip();
        trip.setId(10L);
        trip.setUser(owner);
        trip.setStatus(status);
        Taxi expense = new Taxi();
        expense.setId(20L);
        expense.setType(ExpenseType.TAXI);
        expense.setTrip(trip);
        when(trips.findById(10L)).thenReturn(Optional.of(trip));
        when(expenses.findById(20L)).thenReturn(Optional.of(expense));
    }

    @ParameterizedTest
    @EnumSource(value = TripStatus.class, names = {"DRAFT", "PENDING_APPROVAL", "REJECTED"})
    void financeCannotReadNonApprovedTripThroughGenericTripOrExpenseRoute(TripStatus status) {
        fixture(status);
        User finance = user(2L, RoleType.ROLE_FINANCE);
        assertThrows(UnauthorizedException.class, () -> tripService.getTripById(10L, finance));
        assertThrows(UnauthorizedException.class, () -> expenseService.getExpenseById(20L, finance));
    }

    @Test void financeCanReadApprovedTripsAndExpenses() {
        fixture(TripStatus.APPROVED);
        when(refunds.findByTrip(trip)).thenReturn(Optional.empty());
        User finance = user(2L, RoleType.ROLE_FINANCE);
        assertEquals(10L, tripService.getTripById(10L, finance).getId());
        assertEquals(20L, expenseService.getExpenseById(20L, finance).getId());
    }

    @Test void ownerAndApproverRetainTheirReadAccess() {
        fixture(TripStatus.DRAFT);
        User approver = user(2L, RoleType.ROLE_APPROVER);
        assertEquals(10L, tripService.getTripById(10L, owner).getId());
        assertEquals(20L, expenseService.getExpenseById(20L, owner).getId());
        assertEquals(10L, tripService.getTripById(10L, approver).getId());
        assertEquals(20L, expenseService.getExpenseById(20L, approver).getId());
    }
}
