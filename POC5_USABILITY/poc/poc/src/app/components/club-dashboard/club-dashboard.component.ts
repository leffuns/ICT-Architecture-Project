import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Club, Facility, Booking, TimeSlot } from '../../models';

@Component({
  selector: 'app-club-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>🏢 Club Dashboard</h1>
      
      <div class="club-selector">
        <label>Selecteer club:</label>
        <select [(ngModel)]="selectedClubId" (ngModelChange)="loadClubData()">
          <option *ngFor="let club of clubs" [value]="club.id">{{ club.name }}</option>
        </select>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <h2>Mijn Terreinen</h2>
          <div class="facilities-list">
            <div class="facility-item" *ngFor="let f of facilities">
              <div class="facility-info">
                <span class="sport-badge" [class]="f.type">{{ f.type }}</span>
                <strong>{{ f.name }}</strong>
              </div>
              <span class="price">€{{ f.pricePerHour }}/uur</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Beschikbaarheid beheren</h2>
          <div class="availability-manager">
            <div class="form-group">
              <label>Terrein:</label>
              <select [(ngModel)]="selectedFacilityId" (ngModelChange)="loadManageSlots()">
                <option *ngFor="let f of facilities" [value]="f.id">{{ f.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Datum:</label>
              <input type="date" [(ngModel)]="manageDate" (ngModelChange)="loadManageSlots()">
            </div>
            
            <div class="slots-toggle" *ngIf="manageSlots.length > 0">
              <div class="slot-row" *ngFor="let slot of manageSlots">
                <span class="time">{{ slot.startTime }} - {{ slot.endTime }}</span>
                <button 
                  class="btn-toggle"
                  [class.available]="slot.available"
                  [class.has-booking]="hasBookingForSlot(slot)"
                  (click)="openSlotDetail(slot)">
                  {{ getSlotButtonText(slot) }}
                </button>
              </div>
            </div>
            <div class="no-slots" *ngIf="manageSlots.length === 0">
              <p>Geen tijdslots voor deze datum</p>
            </div>
          </div>
        </div>

        <div class="card full-width">
          <h2>Recente Reserveringen</h2>
          <div class="bookings-table" *ngIf="bookings.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Referentie</th>
                  <th>Terrein</th>
                  <th>Datum</th>
                  <th>Tijd</th>
                  <th>Klant</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of bookings">
                  <td>{{ b.id }}</td>
                  <td>{{ b.facilityName }}</td>
                  <td>{{ b.date }}</td>
                  <td>{{ b.startTime }}-{{ b.endTime }}</td>
                  <td>{{ b.customerName }}</td>
                  <td>
                    <span class="status" [class]="b.status">{{ b.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="no-bookings" *ngIf="bookings.length === 0">
            <p>Nog geen reserveringen</p>
          </div>
        </div>
      </div>

      <!-- Modal for slot details -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>📅 Reserveringsdetails</h2>
          <div class="modal-content" *ngIf="selectedSlot">
            <div class="detail-row">
              <span class="label">Tijd:</span>
              <span class="value">{{ selectedSlot.startTime }} - {{ selectedSlot.endTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Datum:</span>
              <span class="value">{{ selectedSlot.date }}</span>
            </div>
            <div class="detail-row" *ngIf="selectedBooking">
              <span class="label">Klant:</span>
              <span class="value">{{ selectedBooking.customerName }}</span>
            </div>
            <div class="detail-row" *ngIf="selectedBooking">
              <span class="label">Email:</span>
              <span class="value">{{ selectedBooking.customerEmail }}</span>
            </div>
            <div class="detail-row" *ngIf="selectedBooking">
              <span class="label">Referentie:</span>
              <span class="value">{{ selectedBooking.id }}</span>
            </div>
            <div class="detail-row" *ngIf="selectedBooking">
              <span class="label">Status:</span>
              <span class="status" [class]="selectedBooking.status">{{ selectedBooking.status }}</span>
            </div>
            
            <div class="no-booking" *ngIf="!selectedBooking">
              <p>Dit tijdslot is beschikbaar</p>
            </div>

            <div class="modal-actions">
              <button class="btn-direct" *ngIf="!selectedBooking" (click)="bookSlotDirect()">
                ✓ Direct reserveren
              </button>
              <button class="btn-cancel" *ngIf="selectedBooking" (click)="cancelReservation()">
                Reservering annuleren
              </button>
              <button class="btn-close" (click)="closeModal()">Sluiten</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { color: #2c3e50; margin-bottom: 2rem; }
    .club-selector {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .club-selector select { padding: 0.5rem; font-size: 1rem; }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    .card {
      background: #fff;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card.full-width { grid-column: 1 / -1; }
    .card h2 { color: #2c3e50; margin-bottom: 1rem; font-size: 1.2rem; }
    .facility-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
    }
    .facility-info { display: flex; align-items: center; gap: 0.5rem; }
    .sport-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .sport-badge.tennis { background: #27ae60; color: white; }
    .sport-badge.padel { background: #e74c3c; color: white; }
    .sport-badge.voetbal { background: #3498db; color: white; }
    .price { color: #7f8c8d; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; }
    .form-group select, .form-group input { padding: 0.5rem; width: 100%; }
    .slots-toggle { margin-top: 1rem; }
    .slot-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }
    .slot-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .time { font-weight: 600; color: #2c3e50; }
    .booked { color: #e74c3c; font-size: 0.85rem; }
    .btn-toggle {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: #e74c3c;
      color: white;
      font-size: 0.85rem;
    }
    .btn-toggle.available { background: #27ae60; }
    .btn-toggle.booked { background: #f39c12; }
    .btn-toggle.has-booking { background: #f39c12; }
    .no-slots { text-align: center; padding: 2rem; color: #7f8c8d; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    .status { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .status.paid { background: #27ae60; color: white; }
    .status.confirmed { background: #3498db; color: white; }
    .status.pending { background: #f39c12; color: white; }
    .no-bookings { text-align: center; padding: 2rem; color: #7f8c8d; }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .modal h2 { color: #2c3e50; margin-bottom: 1.5rem; }
    .modal-content { }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row .label { color: #7f8c8d; }
    .detail-row .value { font-weight: 600; color: #2c3e50; }
    .no-booking { text-align: center; padding: 1rem; color: #27ae60; }
    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .btn-cancel {
      flex: 1;
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-direct {
      flex: 1;
      background: #27ae60;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-close {
      flex: 1;
      background: #95a5a6;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class ClubDashboardComponent implements OnInit {
  clubs: Club[] = [];
  facilities: Facility[] = [];
  bookings: Booking[] = [];
  manageSlots: TimeSlot[] = [];
  selectedClubId: string = '1';
  selectedFacilityId: string = '';
  manageDate: string = '';
  
  showModal: boolean = false;
  selectedSlot: TimeSlot | null = null;
  selectedBooking: Booking | null = null;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const today = new Date();
    this.manageDate = today.toISOString().split('T')[0];
    this.dataService.getClubs().subscribe(clubs => {
      this.clubs = clubs;
      if (clubs.length > 0) {
        this.selectedClubId = clubs[0].id;
        this.loadClubData();
      }
    });
  }

  loadClubData() {
    this.dataService.getFacilities().subscribe(all => {
      this.facilities = all.filter(f => f.clubId === this.selectedClubId);
      if (this.facilities.length > 0) {
        this.selectedFacilityId = this.facilities[0].id;
        this.loadManageSlots();
      }
    });
    this.dataService.getClubBookings(this.selectedClubId).subscribe(b => {
      this.bookings = b;
      this.cdr.detectChanges();
    });
  }

  loadManageSlots() {
    if (this.selectedFacilityId) {
      this.dataService.getTimeSlots(this.selectedFacilityId, this.manageDate).subscribe(s => {
        this.manageSlots = s;
        this.cdr.detectChanges();
      });
    }
  }

  hasBookingForSlot(slot: TimeSlot): boolean {
    return !!this.bookings.find(b => 
      b.facilityId === slot.facilityId &&
      b.date === slot.date &&
      b.startTime === slot.startTime &&
      (b.status === 'paid' || b.status === 'confirmed')
    );
  }

  getSlotButtonText(slot: TimeSlot): string {
    if (this.hasBookingForSlot(slot)) {
      return 'Gereserveerd';
    }
    return slot.available ? 'Beschikbaar' : 'Niet beschikbaar';
  }

  openSlotDetail(slot: TimeSlot) {
    this.selectedSlot = slot;
    this.selectedBooking = this.bookings.find(b => 
      b.facilityId === slot.facilityId &&
      b.date === slot.date &&
      b.startTime === slot.startTime &&
      (b.status === 'paid' || b.status === 'confirmed')
    ) || null;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.selectedSlot = null;
    this.selectedBooking = null;
  }

  cancelReservation() {
    if (this.selectedBooking && confirm(`Weet je zeker dat je de reservering van ${this.selectedBooking.customerName} wilt annuleren?`)) {
      this.dataService.cancelBooking(this.selectedBooking.id).subscribe(() => {
        this.closeModal();
        this.loadManageSlots();
        this.loadClubData();
      });
    }
  }

  bookSlotDirect() {
    if (!this.selectedSlot) return;
    
    const facility = this.facilities.find(f => f.id === this.selectedSlot?.facilityId);
    
    this.dataService.createBooking({
      facilityId: this.selectedSlot.facilityId,
      facilityName: facility?.name || '',
      slotId: this.selectedSlot.id,
      date: this.selectedSlot.date,
      startTime: this.selectedSlot.startTime,
      endTime: this.selectedSlot.endTime,
      customerName: 'Directe club boeking',
      customerEmail: this.selectedClubId + '@club.be',
      totalPrice: 0
    }).subscribe(booking => {
      this.dataService.updateBookingStatus(booking.id, 'paid').subscribe();
      this.closeModal();
      this.loadManageSlots();
      this.loadClubData();
    });
  }

  toggleSlot(slot: TimeSlot) {
    this.dataService.toggleSlotAvailability(this.selectedFacilityId, slot.id).subscribe(() => {
      this.loadManageSlots();
    });
  }
}