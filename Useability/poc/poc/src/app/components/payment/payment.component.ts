import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Booking } from '../../models';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="loading" *ngIf="loading">Laden...</div>
    
    <div class="container" *ngIf="!loading && booking">
      <h1>Betaling</h1>
      
      <div class="payment-summary">
        <h2>Te betalen: €{{ booking.totalPrice }}</h2>
        <p>{{ booking.facilityName }} - {{ booking.date }} {{ booking.startTime }}-{{ booking.endTime }}</p>
      </div>

      <div class="payment-form" *ngIf="!processing && !paid">
        <h2>Betaalgegevens</h2>
        <div class="form-group">
          <label>Kaarthouder:</label>
          <input type="text" [(ngModel)]="cardName" placeholder="Naam op kaart">
        </div>
        <div class="form-group">
          <label>Kaartnummer:</label>
          <input type="text" [(ngModel)]="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Vervaldatum:</label>
            <input type="text" [(ngModel)]="expiry" placeholder="MM/YY" maxlength="5">
          </div>
          <div class="form-group">
            <label>CVV:</label>
            <input type="text" [(ngModel)]="cvv" placeholder="123" maxlength="3">
          </div>
        </div>

        <button class="btn-pay" (click)="processPayment()" [disabled]="!isValid()">
          Betalen
        </button>
      </div>

      <div class="processing" *ngIf="processing">
        <div class="spinner"></div>
        <p>Betaling wordt verwerkt...</p>
      </div>

      <div class="success" *ngIf="paid">
        <h2>✅ Betaling geslaagd!</h2>
        <a [routerLink]="['/confirmation', booking.id]" class="btn-confirm">Naar bevestiging</a>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 500px; margin: 0 auto; padding: 2rem; }
    h1 { color: #2c3e50; margin-bottom: 2rem; }
    .payment-summary {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      text-align: center;
    }
    .payment-summary h2 { color: #27ae60; margin-bottom: 0.5rem; }
    .payment-form h2 { margin-bottom: 1.5rem; color: #2c3e50; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .form-row { display: flex; gap: 1rem; }
    .form-row .form-group { flex: 1; }
    .btn-pay {
      width: 100%;
      background: #27ae60;
      color: white;
      padding: 1rem;
      border: none;
      border-radius: 6px;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .btn-pay:disabled { background: #bdc3c7; }
    .processing { text-align: center; padding: 3rem; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .success { text-align: center; padding: 2rem; }
    .success h2 { color: #27ae60; margin-bottom: 1.5rem; }
    .btn-confirm {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 1rem 2rem;
      text-decoration: none;
      border-radius: 6px;
    }
    .loading { text-align: center; padding: 4rem; color: #7f8c8d; }
  `]
})
export class PaymentComponent implements OnInit {
  booking: Booking | undefined;
  cardName: string = '';
  cardNumber: string = '';
  expiry: string = '';
  cvv: string = '';
  processing: boolean = false;
  paid: boolean = false;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dataService.updateBookingStatus(id, 'pending').subscribe(() => {
        this.booking = {
          id,
          facilityId: '1',
          facilityName: 'Tennisveld',
          slotId: '1',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00',
          customerName: '',
          customerEmail: '',
          totalPrice: 25,
          status: 'pending',
          createdAt: new Date()
        };
        this.loading = false;
        this.cdr.detectChanges();
      });
    } else {
      this.loading = false;
    }
  }

  isValid(): boolean {
    return this.cardName.length > 0 && this.cardNumber.length >= 16 && 
           this.expiry.length === 5 && this.cvv.length === 3;
  }

  processPayment() {
    this.processing = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.booking) {
        this.dataService.updateBookingStatus(this.booking.id, 'paid').subscribe();
      }
      this.processing = false;
      this.paid = true;
      this.cdr.detectChanges();
    }, 2000);
  }
}