import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">SportReserve</a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
          <a routerLink="/facilities" routerLinkActive="active">Terreinen</a>
          <a routerLink="/club" routerLinkActive="active">Club Dashboard</a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #2c3e50;
      padding: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      color: #fff;
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
    }
    .nav-links {
      display: flex;
      gap: 2rem;
    }
    .nav-links a {
      color: #ecf0f1;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      background: #3498db;
    }
  `]
})
export class NavbarComponent {}