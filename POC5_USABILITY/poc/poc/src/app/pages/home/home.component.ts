import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero">
      <h1>Sportterreinen Reserveren</h1>
      <p>Boek eenvoudig tennis, padel of voetbal terreinen bij jou in de buurt</p>
      <a routerLink="/facilities" class="btn-primary">Bekijk Terreinen</a>
    </div>
    <div class="features">
      <div class="feature">
        <h3>Tennis</h3>
        <p>Reserver overdekte en buiten tennisvelden</p>
      </div>
      <div class="feature">
        <h3>Padel</h3>
        <p>Speel padel bij de beste clubs</p>
      </div>
      <div class="feature">
        <h3>Voetbal</h3>
        <p>Boek kunstgras en natuurgras velden</p>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
    .btn-primary {
      background: #fff;
      color: #667eea;
      padding: 1rem 2rem;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 3rem auto;
      padding: 0 2rem;
    }
    .feature {
      padding: 2rem;
      border-radius: 8px;
      background: #f8f9fa;
      text-align: center;
    }
    .feature h3 { color: #2c3e50; margin-bottom: 0.5rem; }
  `]
})
export class HomeComponent {}