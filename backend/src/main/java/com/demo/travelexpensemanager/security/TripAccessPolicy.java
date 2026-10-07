package com.demo.travelexpensemanager.security;

import com.demo.travelexpensemanager.exception.UnauthorizedException;
import com.demo.travelexpensemanager.model.Trip;
import com.demo.travelexpensemanager.model.User;
import com.demo.travelexpensemanager.model.enums.RoleType;
import com.demo.travelexpensemanager.model.enums.TripStatus;

public final class TripAccessPolicy {
    private TripAccessPolicy() {}

    public static void requireReadAccess(Trip trip, User currentUser) {
        if (trip.getUser().getId().equals(currentUser.getId())) {
            return;
        }
        boolean approver = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleType.ROLE_APPROVER);
        boolean finance = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleType.ROLE_FINANCE);
        if (approver || (finance && trip.getStatus() == TripStatus.APPROVED)) {
            return;
        }
        throw new UnauthorizedException("You don't have permission to access this trip");
    }
}
