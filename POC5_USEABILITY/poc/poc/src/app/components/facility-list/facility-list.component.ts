import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Facility, SportType } from '../../models';

@Component({
  selector: 'app-facility-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <h1>Sportterreinen</h1>
      
      <div class="filters">
        <div class="filter-group">
          <label>Sporttype:</label>
          <select [(ngModel)]="sportType" (ngModelChange)="loadFacilities()">
            <option value="">Alle sporten</option>
            <option value="tennis">Tennis</option>
            <option value="padel">Padel</option>
            <option value="voetbal">Voetbal</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Zoeken:</label>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="loadFacilities()" placeholder="Naam of club...">
        </div>
      </div>

      <div class="facilities-grid">
        <div class="facility-card" *ngFor="let facility of facilities">
          <img [src]="facility.imageUrl" [alt]="facility.name">
          <div class="card-content">
            <span class="sport-badge" [class]="facility.type">{{ facility.type }}</span>
            <h3>{{ facility.name }}</h3>
            <p class="club">{{ facility.clubName }}</p>
            <p class="description">{{ facility.description }}</p>
            <div class="price">€{{ facility.pricePerHour }}/uur</div>
            <a [routerLink]="['/facilities', facility.id]" class="btn-book">Bekijk & Boek</a>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="facilities.length === 0">
        <p>Geen terreinen gevonden met deze criteria.</p>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { color: #2c3e50; margin-bottom: 2rem; }
    .filters {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-group label { font-weight: 500; }
    .filter-group select, .filter-group input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .facilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }
    .facility-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      background: #fff;
    }
    .facility-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }
    .card-content { padding: 1.5rem; }
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
    .club { color: #7f8c8d; margin: 0.5rem 0; }
    .description { font-size: 0.9rem; color: #95a5a6; margin-bottom: 1rem; }
    .price { font-size: 1.2rem; font-weight: bold; color: #2c3e50; margin-bottom: 1rem; }
    .btn-book {
      display: block;
      background: #3498db;
      color: white;
      text-align: center;
      padding: 0.75rem;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .btn-book:hover { background: #2980b9; }
    .empty { text-align: center; padding: 3rem; color: #7f8c8d; }
  `]
})
export class FacilityListComponent implements OnInit {
  facilities: Facility[] = [];
  sportType: SportType | '' = '';
  searchTerm: string = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadFacilities();
  }

  loadFacilities() {
    this.dataService.getFacilities(
      this.sportType || undefined,
      this.searchTerm || undefined
    ).subscribe(data => this.facilities = data);
  }
}