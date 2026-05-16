import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay} from 'rxjs';
import { Club, Facility, TimeSlot, Booking, SportType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private clubs: Club[] = [
    { id: '1', name: 'TC De Linden', address: 'Lindenstraat 15, 3000 Leuven', phone: '016/123456', email: 'info@delinden.be' },
    { id: '2', name: 'Padel Club Leuven', address: 'Stationstraat 88, 3000 Leuven', phone: '016/789012', email: 'info@pcl.be' },
    { id: '3', name: 'Sportpark Vanderhof', address: 'Sportlaan 45, 3300 Tienen', phone: '016/345678', email: 'info@vanderhof.be' }
  ];

  private facilities: Facility[] = [
    { id: '1', clubId: '1', clubName: 'TC De Linden', type: 'tennis', name: 'Tennisveld 1', description: 'Overdekt tennisveld met harde ondergrond', pricePerHour: 25, imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400' },
    { id: '2', clubId: '1', clubName: 'TC De Linden', type: 'tennis', name: 'Tennisveld 2', description: 'Buiten tennisveld met gravel', pricePerHour: 20, imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34fb?w=400' },
    { id: '3', clubId: '2', clubName: 'Padel Club Leuven', type: 'padel', name: 'Padelbaan 1', description: 'Moderne overdekte padelbaan', pricePerHour: 30, imageUrl: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=400' },
    { id: '4', clubId: '2', clubName: 'Padel Club Leuven', type: 'padel', name: 'Padelbaan 2', description: 'Buiten padelbaan', pricePerHour: 25, imageUrl: 'https://images.unsplash.com/photo-1628717344745-1a4f083d2d5c?w=400' },
    { id: '5', clubId: '3', clubName: 'Sportpark Vanderhof', type: 'voetbal', name: 'Voetbalveld 1', description: 'Kunstgrasveld, 5v5', pricePerHour: 50, imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400' },
    { id: '6', clubId: '3', clubName: 'Sportpark Vanderhof', type: 'voetbal', name: 'Voetbalveld 2', description: 'Natuurgrasveld, 7v7', pricePerHour: 60, imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400' }
  ];

  private bookings: Booking[] = [];

  private generateTimeSlots(facilityId: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();

    for (let day = 0; day < 14; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = date.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      for (let hour = 8; hour < 22; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        
        const hasBooking = this.bookings.some(b => 
          b.facilityId === facilityId &&
          b.date === dateStr &&
          b.startTime === startTime &&
          (b.status === 'paid' || b.status === 'confirmed')
        );

        slots.push({
          id: `${facilityId}-${dateStr}-${hour}`,
          facilityId,
          date: dateStr,
          startTime: startTime,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          available: !hasBooking
        });
      }
    }
    return slots;
  }

  getClubs(): Observable<Club[]> {
    return of(this.clubs).pipe(delay(200));
  }

  getFacilities(sportType?: SportType, search?: string): Observable<Facility[]> {
    let result = this.facilities;
    if (sportType) {
      result = result.filter(f => f.type === sportType);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(term) ||
        f.clubName.toLowerCase().includes(term)
      );
    }
    return of(result).pipe(delay(200));
  }

  getFacility(id: string): Observable<Facility | undefined> {
    return of(this.facilities.find(f => f.id === id)).pipe(delay(200));
  }

  getTimeSlots(facilityId: string, date?: string): Observable<TimeSlot[]> {
    let slots = this.generateTimeSlots(facilityId);
    if (date) {
      slots = slots.filter(s => s.date === date);
    }
    return of(slots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    })).pipe(delay(300));
  }

  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Observable<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: 'BK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      status: 'pending',
      createdAt: new Date()
    };
    this.bookings.push(newBooking);
    return of(newBooking).pipe(delay(500));
  }

  updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'paid'): Observable<Booking | undefined> {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = status;
    }
    return of(booking).pipe(delay(300));
  }

  getClubBookings(clubId: string): Observable<Booking[]> {
    const clubFacilities = this.facilities.filter(f => f.clubId === clubId).map(f => f.id);
    const clubBookings = this.bookings.filter(b => clubFacilities.includes(b.facilityId));
    return of(clubBookings).pipe(delay(200));
  }

  toggleSlotAvailability(facilityId: string, slotId: string): Observable<TimeSlot | undefined> {
    const slots = this.generateTimeSlots(facilityId);
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      slot.available = !slot.available;
    }
    return of(slot).pipe(delay(200));
  }

  cancelBooking(bookingId: string): Observable<boolean> {
    const index = this.bookings.findIndex(b => b.id === bookingId);
    if (index > -1) {
      this.bookings.splice(index, 1);
      return of(true).pipe(delay(200));
    }
    return of(false).pipe(delay(200));
  }
}