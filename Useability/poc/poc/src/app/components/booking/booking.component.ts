import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Facility, TimeSlot } from '../../models';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="loading" *ngIf="loading">Laden...</div>
    
    <div class="container" *ngIf="!loading && facility && slot">
      <h1>Reservering</h1>
      
      <div class="booking-summary">
        <h2>Overzicht</h2>
        <div class="summary-item">
          <span>Terrein:</span>
          <strong>{{ facility.name }}</strong>
        </div>
        <div class="summary-item">
          <span>Club:</span>
          <strong>{{ facility.clubName }}</strong>
        </div>
        <div class="summary-item">
          <span>Datum:</span>
          <strong>{{ slot.date }}</strong>
        </div>
        <div class="summary-item">
          <span>Tijd:</span>
          <strong>{{ slot.startTime }} - {{ slot.endTime }}</strong>
        </div>
        <div class="summary-item total">
          <span>Totaal:</span>
          <strong>€{{ facility.pricePerHour }}</strong>
        </div>
      </div>

      <div class="booking-form">
        <h2>Jouw gegevens</h2>
        <div class="form-group">
          <label>Naam:</label>
          <input type="text" [(ngModel)]="customerName" placeholder="Jouw naam">
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" [(ngModel)]="customerEmail" placeholder="jouw@email.be">
        </div>

        <button class="btn-proceed" (click)="proceedToPayment()" [disabled]="!isValid()">
          Naar betaling
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 600px; margin: 0 auto; padding: 2rem; }
    h1 { color: #2c3e50; margin-bottom: 2rem; }
    .booking-summary {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    .booking-summary h2 { margin-bottom: 1rem; color: #2c3e50; }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }
    .summary-item.total {
      border-bottom: none;
      font-size: 1.2rem;
      color: #27ae60;
    }
    .booking-form { background: #fff; padding: 1.5rem; border-radius: 12px; border: 1px solid #eee; }
    .booking-form h2 { margin-bottom: 1.5rem; color: #2c3e50; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .btn-proceed {
      width: 100%;
      background: #3498db;
      color: white;
      padding: 1rem;
      border: none;
      border-radius: 6px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-proceed:hover:not(:disabled) { background: #2980b9; }
    .btn-proceed:disabled { background: #bdc3c7; cursor: not-allowed; }
    .loading { text-align: center; padding: 4rem; color: #7f8c8d; }
  `]
})
export class BookingComponent implements OnInit {
  facility: Facility | undefined;
  slot: TimeSlot | undefined;
  customerName: string = '';
  customerEmail: string = '';
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const facilityId = this.route.snapshot.paramMap.get('facilityId');
    const slotId = this.route.snapshot.queryParamMap.get('slotId');
    const date = this.route.snapshot.queryParamMap.get('date');
    const startTime = this.route.snapshot.queryParamMap.get('startTime');
    const endTime = this.route.snapshot.queryParamMap.get('endTime');

    if (slotId && date && startTime && endTime) {
      this.slot = {
        id: slotId,
        facilityId: facilityId || '',
        date: date,
        startTime: startTime,
        endTime: endTime,
        available: true
      };
    }

    if (facilityId) {
      this.dataService.getFacility(facilityId).subscribe(f => {
        this.facility = f;
        this.loading = false;
        this.cdr.detectChanges();
      });
    } else {
      this.loading = false;
    }
  }

  isValid(): boolean {
    return this.customerName.trim().length > 0 && 
           this.customerEmail.trim().length > 0 && 
           this.customerEmail.includes('@');
  }

  proceedToPayment() {
    if (!this.facility || !this.slot || !this.isValid()) return;

    this.dataService.createBooking({
      facilityId: this.facility.id,
      facilityName: this.facility.name,
      slotId: this.slot.id,
      date: this.slot.date,
      startTime: this.slot.startTime,
      endTime: this.slot.endTime,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      totalPrice: this.facility.pricePerHour
    }).subscribe(booking => {
      this.router.navigate(['/payment', booking.id]);
    });
  }
}