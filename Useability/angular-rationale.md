# Angular Frontend Keuze: Rationale per Karakteristiek

Hierin wordt verder uitgelegd waarom angular gekozen is.

## Overzicht

Angular is gekozen als frontend-framework vanwege de sterke integratie met de andere architectuurkarakteristieken. De frontend werkt naadloos samen met de Python/Flask backend en ondersteunt de vereisten van Availability, Integrity, Security en Scalability.

---

## Angular + Availability (Python/Flask)

### Decoupled Architectuur

Angular draait als Single Page Application (SPA) onafhankelijk van de Flask backend. Dit betekent:

- **Separation of concerns**: Angular served via CDN/static files, terwijl Flask API's op aparte servers draaien
- **Gedeeltelijke beschikbaarheid**: Gebruikers kunnen terreinen en beschikbaarheid bekijken via Angular, zelfs als boekingsfunctionaliteit tijdelijk niet beschikbaar is
- **Stateless frontend**: Angular stuurt elke request naar de API-loadbalancer, die requests verdeelt over de beschikbare Flask-replicas

### Praktische Implementatie

```
Angular App (Client) → Load Balancer → Flask Replica 1/2/3
                                   → Flask Replica 2 (fallback)
                                   → Flask Replica 3 (fallback)
```

Bij de Availability POC met 3 Flask-replicas:
- Angular's HttpClient stuurt requests naar `http://api/platform`
- Docker Swarm's ingress load balancer routeert naar beschikbare replicas
- Als één replica uitvalt (via `/fail` endpoint), blijft de Angular-app functioneel

### Caching Strategie

Angular's HttpClient kan responsen cachen voor:
- Statische content (terreinlijst, clubinfo)
- Bekijken van beschikbaarheid tijdens backend-maintenance

---

## Angular + Integrity (MySQL)

### Client-side Validatie als Eerste Verdedigingslinie

Angular's form system vormt de eerste laag van data-integriteit:

| Angular Feature | Doel |
|-----------------|------|
| Reactive Forms | Type-safe formulieren met validators |
| TypeScript | Compile-time type-checking voorkomt type-fouten |
| Custom Validators | Business rules client-side valideren |
| Real-time Feedback | Directe foutmeldingen bij ongeldige input |

### Validatie Pipeline

```
User Input → Angular Validators → TypeScript Types → API Request → MySQL Constraints
                ↓                         ↓                  ↓               ↓
          Block invalid           Compile-time        JWT token        SELECT FOR
          input direct            checks              validation       UPDATE locks
```

### Integratie met Integrity POC

De Integrity POC toont aan dat MySQL met `SELECT FOR UPDATE` voorkomt dat dubbele boekingen ontstaan. Angular ondersteunt dit door:

#### 1. Optimistic UI - Directe Feedback

**Wat is het probleem?**
Wanneer een gebruiker een boeking maakt, houdt MySQL een lock op het tijdslot. Deze lock moet worden vrijgegeven nadat de boeking is bevestigd. Dit duurt even, maar de gebruiker wil direct weten of zijn boeking is gelukt.

**Hoe Angular dit oplost:**
Angular toont direct een "bezig met verwerken" state terwijl de backend bezig is. Zodra de backend lock vrijgeeft en de boeking bevestigt, toont Angular de success.

```
Tijd →
─────────────────────────────────────────────────────────▶

Gebruiker:  [Klik "Boek"]  →  [Wacht...]  →  [Succes!]

Angular:    [Verstuur]    →  [Laad state] →  [Toon resultaat]
                                │
                                │  MySQL lock actief
                                ▼
Backend:                   [SELECT FOR UPDATE]
                           [Insert booking]
                           [Commit/Release lock]
```

**Code voorbeeld:**
```typescript
proceedToPayment() {
  this.processing = true;  // Directe UI feedback

  this.dataService.createBooking(bookingData).subscribe({
    next: (result) => {
      this.processing = false;
      this.router.navigate(['/confirmation', result.id]);
    },
    error: (err) => {
      this.processing = false;
      this.errorMessage = 'Boeking kon niet worden bevestigd';
    }
  });
}
```

**Waarom dit belangrijk is:**
- Gebruiker hoeft niet te wachten tot lock vrijkomt voor feedback
- Snellere perceived performance
- Backend kan Rustig de lock vrijgeven terwijl gebruiker al weet dat het goed gaat

---

#### 2. Conflict Handling - 409 Conflict Responses

**Wat is het probleem?**
Twee gebruikers kunnen tegelijkertijd hetzelfde tijdslot boeken. De eerste krijgt de lock, de tweede krijgt een conflict (409 Conflict).

**Hoe Angular dit oplost:**
Angular's HttpClient vangt de 409 response op en toont een duidelijke foutmelding aan de gebruiker met de optie om een ander tijdslot te kiezen.

```
Gebruiker A                    Gebruiker B
    │                              │
    ▼                              ▼
[Boek slot X]              [Boek slot X]
    │                              │
    ▼                              ▼
Flask + MySQL              Flask + MySQL
    │                              │
    ▼                              ▼
Lock gekregen              Lock mislukt
    │                              │
    ▼                              ▼
[Succes]                   [409 Conflict]
                              │
                              ▼
                       Angular toont:
                       "Dit tijdslot is net geboekt door iemand anders.
                        Kies een ander tijdslot."
```

**Code voorbeeld:**
```typescript
createBooking(bookingData: any): Observable<Booking> {
  return this.http.post<Booking>('/api/bookings', bookingData).pipe(
    catchError(error => {
      if (error.status === 409) {
        // Parse conflict response voor specifieke foutmelding
        return throwError(() => new Error(
          'Dit tijdslot is net geboekt. Kies een ander moment.'
        ));
      }
      return throwError(() => new Error('Onverwachte fout'));
    })
  );
}
```

**In de component:**
```typescript
this.dataService.createBooking(data).subscribe({
  next: (booking) => this.router.navigate(['/confirmation', booking.id]),
  error: (err) => {
    if (err.message.includes('net geboekt')) {
      this.showConflictDialog();  // Toon conflict dialoog
    } else {
      this.showGenericError();    // Toon algemene fout
    }
  }
});
```

**Conflict Dialog UI:**
```html
<div class="conflict-dialog" *ngIf="showConflict">
  <h2>⚠️ Tijdslot niet meer beschikbaar</h2>
  <p>Dit tijdslot is net geboekt door een andere gebruiker.</p>
  <button (click)="goBackToSlots()">Kies een ander tijdslot</button>
</div>
```

---

### Samenvatting: Integrity Ondersteuning

| Angular Feature | Doel | Integratie met Integrity POC |
|-----------------|------|------------------------------|
| **Optimistic UI** | Directe feedback | Toon "verwerken" terwijl MySQL lock actief is |
| **Conflict handling** | Netjes omgaan met 409 | Toon duidelijke fout + optie om nieuw slot te kiezen |
| **Client-side validatie** | Voorkom ongeldige data | TypeScript + Reactive Forms validators vóór API call |
| **TypeScript types** | Compile-time integriteit | Voorkom type-fouten die naar backend gaan |

### Voorbeeld Flow

1. Gebruiker selecteert tijdslot in Angular form
2. Angular's `RequiredValidator` en `AsyncValidator` controleren input
3. Bij geldige data: HTTP POST naar Flask API
4. Flask voert `SELECT ... FOR UPDATE` uit op MySQL
5. Angular toont success/error message op basis van response

---

## Angular + Security (POC1_SECURABILITY / Keycloak)

### Architectuur Overzicht

```
User → Angular App → Keycloak → JWT Token
                     ↓
              Alle API Requests
              (met token in header)
```

### HTTP Interceptors - Automatische Token Injectie

**Probleem:** Elke API-request moet een JWT-token bevatten voor authenticatie
**Oplossing:** Angular interceptor vangt ALLE requests af en voegt token toe aan elke request

```typescript
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();  // Haal token op uit memory/storage
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }  // Voeg toe aan Authorization header
      });
    }
    return next.handle(req);  // Ga door naar API
  }
}
```

**Waarom dit belangrijk is:**
- Ontwikkelaar hoeft niet manual token toe te voegen in elke request
- Decoupled van business logic - token management op één plek
- Centrale plek voor token refresh bij 401 responses
- Consistent over alle API calls

### Route Guards - Beschermde Routes

**Probleem:** Niet iedereen mag toegang tot /admin of /club pagina's
**Oplossing:** CanActivate guard controleert rol vóórdat route geladen wordt

```typescript
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const roles = this.authService.getRoles();
    if (roles.includes('platform_admin')) {
      return true;  // Toegang toegestaan
    }
    this.router.navigate(['/unauthorized']);
    return false;  // Toegang geblokkeerd
  }
}
```

**Toepassing in routes:**
```typescript
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AdminGuard]  // Guard toevoegen aan route
}
```

**Beveiligingsniveaus:**
| Route | Guard | Rol |
|-------|-------|-----|
| `/` | Geen | Iedereen |
| `/facilities` | Geen | Iedereen |
| `/book/*` | AuthGuard | end_user, club_admin, platform_admin |
| `/club` | ClubAdminGuard | club_admin, platform_admin |
| `/admin` | AdminGuard | platform_admin |

### Role-based UI - Zichtbaarheid per Rol

**Probleem:** Visibility-based security - bepaalde knoppen/functies tonen of verbergen op basis van gebruikersrol
**Oplossing:** `*ngIf` directive met role check in template

```html
<button *ngIf="hasRole('club_admin')" (click)="openManagement()">
  Beheer club
</button>
<button *ngIf="hasRole('platform_admin')" (click)="openAdminPanel()">
  Platform admin
</button>
<button *ngIf="hasRole('end_user')" (click)="makeBooking()">
  Boek terrein
</button>
```

**In de component:**
```typescript
hasRole(role: string): boolean {
  return this.authService.getRoles().includes(role);
}
```

### Security Features Matrix

| Angular Feature | Doel | POC1_SECURABILITY Integratie |
|-----------------|------|------------------------------|
| **HTTP Interceptors** | Automatisch JWT toevoegen aan elke request | Keycloak token wordt bij elke request meegestuurd |
| **Route Guards** | Toegang blokkeren tot specifieke pagina's | Beschermen van `/admin/*`, `/club` routes |
| **angular-oauth2-oidc** | OAuth2/OIDC library | Officiële Keycloak integratie library |

---

## Angular + Scalability (Python/Flask Replicas)

### Architectuur Overzicht

```
                    ┌─────────────┐
                    │     CDN     │  ← Angular static files (onafhankelijk)
                    └──────┬──────┘
                           │
       ┌───────────┐       ▼
       │  Browser  │  ┌─────────────┐
       │  (Angular)│─▶│Load Balancer│  ← Swarm ingress
       └───────────┘  │  (Swarm)    │
                      └──────┬──────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐ ┌───────────┐ ┌───────────┐
       │  Flask    │ │  Flask    │ │  Flask    │
       │Replica 1 │ │Replica 2 │ │Replica 3 │
       │  (API)    │ │  (API)    │ │  (API)    │
       └───────────┘ └───────────┘ └───────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                      ┌─────────────┐
                      │    MySQL    │
                      │ (met locks) │
                      └─────────────┘
```

### Waarom Angular Schaalbaar is

#### 1. Stateless Frontend

Angular bewaart geen server-side state - dit is cruciaal voor horizontale schaalbaarheid:

- **Elke request is independent**: Geen sessie-data nodig op frontend
- **Geen session affinity**: Load balancer kan willekeurig verdelen
- **Round-robin mogelijk**: Elke Flask-replica kan elke gebruiker bedienen

**Voordeel:** De Scalability POC toont aan dat 3 Flask-replicas ~2-3x hogere throughput geven dan 1 replica. Angular's stateless design maakt dit mogelijk.

```
Zonder Stateless Frontend (probleem):
┌────────┐   session affinity   ┌────────────┐
│User A  │─────────────────────▶│ Replica 1  │  ← Alle users naar dezelfde replica
└────────┘                      └────────────┘

Met Stateless Frontend (oplossing):
┌────────┐   round-robin       ┌────────────┐
│User A  │─────────────────────▶│ Replica 1  │
└────────┘                      └────────────┘
┌────────┐                      ┌────────────┐
│User B  │─────────────────────▶│ Replica 2  │  ← Load verdeeld
└────────┘                      └────────────┘
```

#### 2. Modulaire Architectuur

Angular's standalone components en lazy loading ondersteunen onafhankelijke scaling:

**Lazy Loading (Snellere initiële load):**
```typescript
// Traditioneel (alles laden bij start)
import { AdminComponent } from './admin/admin.component';

// Lazy loading (pas laden als nodig)
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent)
}
```

**Voordelen:**
- **Kleinere initiële bundle**: gebruiker hoeft niet alles downloaden
- **On-demand loading**: admin component only loaded when needed
- **Parallelle scaling**: frontend en backend schalen onafhankelijk

#### 3. Verticale Schaalbaarheid (Per Container)

Binnen elke Flask-container draait Gunicorn met meerdere workers:

```
Angular Request
      │
      ▼
┌─────────────┐
│ Gunicorn    │  ← 4 workers per container
│ (4 threads) │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
  ▼         ▼
Worker 1  Worker 2  ← Parallelle verwerking
  │         │
  └────┬────┘
       │
       ▼
┌─────────────┐
│ MySQL       │  ← SELECT FOR UPDATE locks
│ (integrity) │
└─────────────┘
```

**Hoe Angular dit ondersteunt:**
1. Angular stuurt requests naar de container (niet naar specifieke worker)
2. Gunicorn worker threads verwerken request parallel
3. MySQL `SELECT FOR UPDATE` voorkomt race conditions (zie Integrity POC)
4. Angular's optimistic UI biedt goede gebruikerservaring bij wachtrij

### Samenvatting Scalability Ondersteuning

| Angular Feature | Schaalbaarheidsvoordeel |
|-----------------|------------------------|
| **Stateless design** | Load balancer kan vrij verdelen over replicas |
| **Modulaire architectuur** | Onafhankelijk schalen van frontend en backend |
| **Lazy loading** | Snellere initiële load, minder data per keer |

---

## Samenvatting: Waarom Angular?

Angular is gekozen omdat het:

1. **Availability** ondersteunt door decoupled frontend/backend architectuur
2. **Integrity** versterkt met sterke typing en client-side validatie
3. **Security** implementeert via JWT-interceptors en role-based route guards
4. **Scalability** faciliteert met stateless design en lazy loading

De frontend-backend communicatie via RESTful API's zorgt ervoor dat Angular naadloos integreert met de Python/Flask modulaire monoliet, terwijl elke karakteristiek zijn POC kan draaien onafhankelijk van de frontend.