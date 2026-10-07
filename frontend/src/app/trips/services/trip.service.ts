import { API_BASE_URL } from '../../config/api.config';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, Expense, ExpenseType, CarRental, Hotel, Flight, Taxi } from '../models/trip.model';

const API_URL = `${API_BASE_URL}/trips`;
const EXPENSES_API_URL = `${API_BASE_URL}/expenses`;

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);

  constructor() {
    console.log('TripService initialized with API_URL:', API_URL);
    console.log('Expenses API URL:', EXPENSES_API_URL);
  }

  getUserTrips(): Observable<Trip[]> {
    console.log('Fetching user trips from:', `${API_URL}`);
    return this.http.get<Trip[]>(`${API_URL}`);
  }

  getTripById(id: number): Observable<Trip> {
    console.log('Fetching trip by ID from:', `${API_URL}/${id}`);
    return this.http.get<Trip>(`${API_URL}/${id}`);
  }

  createTrip(trip: Partial<Trip>): Observable<Trip> {
    console.log('Creating trip at:', API_URL, 'with data:', trip);
    return this.http.post<Trip>(`${API_URL}`, trip);
  }

  updateTrip(id: number, trip: Partial<Trip>): Observable<Trip> {
    return this.http.put<Trip>(`${API_URL}/${id}`, trip);
  }

  deleteTrip(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }

  submitTripForApproval(id: number): Observable<Trip> {
    return this.http.post<Trip>(`${API_URL}/${id}/submit`, {});
  }

  private addGenericExpense(tripId: number, expense: Partial<Expense>, type: string): Observable<Expense> {
    console.log(`Adding ${type} expense to trip ${tripId}:`, expense);
    return this.http.post<Expense>(`${EXPENSES_API_URL}/trips/${tripId}/${type}`, expense);
  }

  updateExpense(tripId: number, expenseId: number, expense: Partial<Expense>): Observable<Expense> {
    const type = this.getEndpointForExpenseType(expense.type as ExpenseType);
    return this.http.put<Expense>(`${EXPENSES_API_URL}/${type}/${expenseId}`, expense);
  }

  deleteExpense(tripId: number, expenseId: number): Observable<void> {
    return this.http.delete<void>(`${EXPENSES_API_URL}/${expenseId}`);
  }

  private getEndpointForExpenseType(type: ExpenseType): string {
    switch (type) {
      case ExpenseType.CAR_RENTAL:
        return 'car-rentals';
      case ExpenseType.HOTEL:
        return 'hotels';
      case ExpenseType.FLIGHT:
        return 'flights';
      case ExpenseType.TAXI:
        return 'taxis';
      default:
        throw new Error(`Unknown expense type: ${type}`);
    }
  }

  addCarRental(tripId: number, data: CarRental): Observable<Expense> {
    console.log('Adding car rental:', data);
    return this.http.post<Expense>(`${EXPENSES_API_URL}/trips/${tripId}/car-rentals`, {
      totalPrice: data.totalPrice ?? 0,
      carName: data.carName,
      pickupLocation: data.pickupLocation,
      pickupTime: data.pickupDateTime,
      dropLocation: data.dropoffLocation,
      dropTime: data.dropoffDateTime
    });
  }

  addHotel(tripId: number, data: Hotel): Observable<Expense> {
    console.log('Adding hotel:', data);
    return this.http.post<Expense>(`${EXPENSES_API_URL}/trips/${tripId}/hotels`, {
      totalPrice: data.totalPrice ?? 0,
      hotelName: data.hotelName,
      location: data.location,
      checkInDate: data.checkInDate,
      checkOutDate: data.checkOutDate
    });
  }

  addFlight(tripId: number, data: Flight): Observable<Expense> {
    console.log('Adding flight:', data);
    return this.http.post<Expense>(`${EXPENSES_API_URL}/trips/${tripId}/flights`, {
      totalPrice: data.totalPrice ?? 0,
      airline: data.airline,
      departureLocation: data.from,
      arrivalLocation: data.to,
      departureTime: data.departureDateTime,
      arrivalTime: data.arrivalDateTime
    });
  }

  addTaxi(tripId: number, data: Taxi): Observable<Expense> {
    console.log('Adding taxi with data:', data);
    return this.http.post<Expense>(`${EXPENSES_API_URL}/trips/${tripId}/taxis`, {
      totalPrice: data.totalPrice ?? 0,
      fromLocation: data.from,
      toLocation: data.to,
      time: data.dateTime
    });
  }
}
