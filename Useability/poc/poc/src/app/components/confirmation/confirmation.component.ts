import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Booking } from '../../models';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="success-card">
        <div class="checkmark">✓</div>
        <h1>Reservering Bevestigd!</h1>
        
        <div class="booking-details" *ngIf="booking">
          <div class="ref">Referentie: <strong>{{ booking.id }}</strong></div>
          
          <div class="detail-row">
            <span>Terrein:</span>
            <strong>{{ booking.facilityName }}</strong>
          </div>
          <div class="detail-row">
            <span>Datum:</span>
            <strong>{{ booking.date }}</strong>
          </div>
          <div class="detail-row">
            <span>Tijd:</span>
            <strong>{{ booking.startTime }} - {{ booking.endTime }}</strong>
          </div>
          <div class="detail-row">
            <span>Betaald:</span>
            <strong class="paid">€{{ booking.totalPrice }}</strong>
          </div>
        </div>

        <p class="email-sent">📧 Een bevestigingsmail is verstuurd naar je email.</p>
        
        <a routerLink="/" class="btn-home">Terug naar home</a>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 600px; margin: 0 auto; padding: 2rem; }
    .success-card {
      background: #fff;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
    }
    .checkmark {
      width: 80px;
      height: 80px;
      background: #27ae60;
      color: white;
      font-size: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    h1 { color: #2c3e50; margin-bottom: 2rem; }
    .booking-details {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .ref { text-align: center; margin-bottom: 1.5rem; font-size: 1.2rem; }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child { border-bottom: none; }
    .paid { color: #27ae60; }
    .email-sent { color: #7f8c8d; margin-bottom: 2rem; }
    .btn-home {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 1rem 2rem;
      text-decoration: none;
      border-radius: 6px;
    }
  `]
})
export class ConfirmationComponent implements OnInit {
  booking: Booking | undefined;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Booking ID:', id);
  }
}