package com.demo.travelexpensemanager.service;

import com.demo.travelexpensemanager.dto.request.TripRequest;
import com.demo.travelexpensemanager.exception.UnauthorizedException;
import com.demo.travelexpensemanager.model.Role;
import com.demo.travelexpensemanager.model.Trip;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.model.enums.RoleType;
import com.demo.travelexpensemanager.model.enums.TripStatus;
import com.demo.travelexpensemanager.repository.TripRepository;
import com.demo.travelexpensemanager.repository.RefundStatusRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripOwnershipSecurityTest {
    @Mock TripRepository trips;
    @Mock RefundStatusRepository refunds;
    @InjectMocks TripServiceImpl service;

    private User user(long id, RoleType extraRole) {
        User user = new User();
        user.setId(id);
        user.setRoles(Set.of(new Role(RoleType.ROLE_USER), new Role(extraRole)));
        return user;
    }

    private Trip draft(User owner) {
        Trip trip = new Trip();
        trip.setId(10L);
        trip.setName("Original draft");
        trip.setUser(owner);
        when(trips.findById(10L)).thenReturn(Optional.of(trip));
        return trip;
    }

    @ParameterizedTest
    @EnumSource(value = RoleType.class, names = {"ROLE_APPROVER", "ROLE_FINANCE"})
    void mixedRoleNonOwnerCannotEditDeleteOrSubmitDraft(RoleType extraRole) {
        Trip trip = draft(user(1L, extraRole));
        User nonOwner = user(2L, extraRole);
        assertThrows(UnauthorizedException.class, () -> service.updateTrip(10L, new TripRequest(), nonOwner));
        assertThrows(UnauthorizedException.class, () -> service.deleteTrip(10L, nonOwner));
        assertThrows(UnauthorizedException.class, () -> service.submitTripForApproval(10L, nonOwner));
        assertEquals("Original draft", trip.getName());
        assertEquals(TripStatus.DRAFT, trip.getStatus());
        verify(trips, never()).save(any());
        verify(trips, never()).delete(any());
    }

    @Test void mixedRoleOwnerCanEditAndSubmitTheirDraft() {
        User owner = user(1L, RoleType.ROLE_APPROVER);
        Trip trip = draft(owner);
        when(trips.save(trip)).thenReturn(trip);
        TripRequest request = new TripRequest();
        request.setName("My updated draft");
        assertEquals("My updated draft", service.updateTrip(10L, request, owner).getName());
        assertEquals(TripStatus.PENDING_APPROVAL, service.submitTripForApproval(10L, owner).getStatus());
        assertThrows(UnauthorizedException.class, () -> service.deleteTrip(10L, owner));
        verify(trips, times(2)).save(trip);
    }
}
