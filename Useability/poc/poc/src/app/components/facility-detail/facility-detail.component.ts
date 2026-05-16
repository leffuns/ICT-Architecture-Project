import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Facility, TimeSlot } from '../../models';

@Component({
  selector: 'app-facility-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="loading" *ngIf="loading">Laden...</div>
    
    <div class="not-found" *ngIf="!loading && !facility">
      <h2>Terrein niet gevonden</h2>
      <a routerLink="/facilities" class="back">← Terug naar terreinen</a>
    </div>

    <div class="container" *ngIf="!loading && facility">
      <a routerLink="/facilities" class="back">← Terug naar terreinen</a>
      
      <div class="detail-header">
        <img [src]="facility.imageUrl" [alt]="facility.name">
        <div class="header-content">
          <span class="sport-badge" [class]="facility.type">{{ facility.type }}</span>
          <h1>{{ facility.name }}</h1>
          <p class="club">🏢 {{ facility.clubName }}</p>
          <p class="description">{{ facility.description }}</p>
          <div class="price">€{{ facility.pricePerHour }}/uur</div>
        </div>
      </div>

      <div class="availability">
        <h2>Beschikbaarheid</h2>
        <div class="date-picker">
          <label>Kies een datum:</label>
          <input type="date" [(ngModel)]="selectedDate" (ngModelChange)="loadSlots()">
        </div>

        <div class="slots-loading" *ngIf="slotsLoading">Beschikbaarheid laden...</div>

        <div class="slots-grid" *ngIf="!slotsLoading && slots.length > 0">
          <button 
            *ngFor="let slot of slots"
            class="slot-btn"
            [class.available]="slot.available"
            [class.unavailable]="!slot.available"
            [disabled]="!slot.available"
            (click)="selectSlot(slot)">
            {{ slot.startTime }} - {{ slot.endTime }}
          </button>
        </div>

        <div class="no-slots" *ngIf="!slotsLoading && slots.length === 0">
          <p>Geen tijdslots beschikbaar voor deze datum</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back { color: #3498db; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .detail-header { display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .detail-header img { width: 400px; height: 300px; object-fit: cover; border-radius: 12px; }
    .header-content { flex: 1; }
    .sport-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .sport-badge.tennis { background: #27ae60; color: white; }
    .sport-badge.padel { background: #e74c3c; color: white; }
    .sport-badge.voetbal { background: #3498db; color: white; }
    h1 { margin: 0.5rem 0; color: #2c3e50; }
    .club { color: #7f8c8d; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .description { color: #95a5a6; margin-bottom: 1rem; }
    .price { font-size: 1.5rem; font-weight: bold; color: #2c3e50; }
    .availability { background: #f8f9fa; padding: 2rem; border-radius: 12px; }
    .availability h2 { color: #2c3e50; margin-bottom: 1.5rem; }
    .date-picker { margin-bottom: 1.5rem; }
    .date-picker label { margin-right: 1rem; }
    .date-picker input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
    .slot-btn {
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .slot-btn.available { border-color: #27ae60; color: #27ae60; }
    .slot-btn.available:hover { background: #27ae60; color: white; }
    .slot-btn.unavailable { background: #f0f0f0; color: #bbb; cursor: not-allowed; }
    .no-slots { text-align: center; color: #7f8c8d; padding: 2rem; }
    .loading, .not-found { text-align: center; padding: 4rem; color: #7f8c8d; }
    .slots-loading { text-align: center; padding: 1rem; color: #7f8c8d; }
  `]
})
export class FacilityDetailComponent implements OnInit {
  facility: Facility | undefined;
  slots: TimeSlot[] = [];
  selectedDate: string = '';
  loading: boolean = true;
  slotsLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    this.selectedDate = today.toISOString().substring(0, 10);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('FacilityDetail: Loading for id:', id);
    if (id) {
      this.dataService.getFacility(id).subscribe({
        next: (f) => {
          console.log('FacilityDetail: Got facility:', f);
          this.facility = f;
          this.loading = false;
          this.cdr.detectChanges();
          if (f) {
            this.loadSlots();
          }
        },
        error: (err) => {
          console.error('FacilityDetail: Error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      console.log('FacilityDetail: No id found');
      this.loading = false;
    }
  }

  loadSlots() {
    console.log('Loading slots for:', this.facility?.id, 'date:', this.selectedDate);
    this.slotsLoading = true;
    if (this.facility) {
      this.dataService.getTimeSlots(this.facility.id, this.selectedDate).subscribe({
        next: (s) => {
          console.log('Got slots:', s.length);
          this.slots = s;
          this.slotsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading slots:', err);
          this.slotsLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  selectSlot(slot: TimeSlot) {
    if (this.facility) {
      this.router.navigate(['/book', this.facility.id], {
        queryParams: {
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      });
    }
  }
}