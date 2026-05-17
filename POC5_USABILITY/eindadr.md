# ADR-USEABILITY-001: Angular als Frontend voor Integratie met Architectuurkarakteristieken

## Status

Geaccepteerd

## Context

Het sportterrein-reserveringsplatform vereist een frontend-framework dat niet alleen de usability-eisen ondersteunt, maar ook naadloos integreert met de andere architectuurkarakteristieken. De POC's voor Availability, Integrity, Security en Scalability gebruiken respectievelijk Python/Flask, MySQL, Keycloak en Docker Swarm. De frontend moet deze componenten kunnen aansturen en versterken.

## Decision

We kiezen voor Angular als frontend-framework vanwege de sterke integratie met alle andere architectuurkarakteristieken:

### Angular + Availability

Angular draait als Single Page Application (SPA) onafhankelijk van de Flask backend. Dit maakt een decoupled architectuur mogelijk waarbij:
- De frontend via CDN of statische bestanden kan worden geserveerd
- Gebruikers terreinen en beschikbaarheid kunnen bekijken, zelfs als de backend tijdelijk niet beschikbaar is
- Angular's HttpClient requests stuurt naar een load balancer die Flask-replicas verdeelt
- De frontend geen weet heeft van welke specifieke backend-replica de data verwerkt

### Angular + Integrity

Angular's form system en TypeScript vormen de eerste verdedigingslinie voor data-integriteit:
- **TypeScript**: compile-time type-checking voorkomt type-fouten voordat data de backend bereikt
- **Reactive Forms**: ingebouwde validators (required, min, max, pattern) controleren input client-side
- **Optimistic UI**: toont direct een "verwerken"-state terwijl MySQL's SELECT FOR UPDATE lock actief is
- **Conflict handling**: vangt 409 Conflict responses op en toont duidelijke foutmeldingen bij race conditions

### Angular + Security

Angular's ingebouwde beveiligingsfeatures sluiten direct aan bij de Keycloak-integratie:
- **HTTP Interceptors**: vangen alle requests af en voegen automatisch JWT-tokens toe aan de Authorization header
- **Route Guards**: CanActivate guards beschermen routes op basis van rollen (end_user, club_admin, platform_admin)
- **Role-based UI**: ngIf directives verbergen elementen voor onbevoegde gebruikers


### Angular + Scalability

Angular's architectuur ondersteunt horizontaal schalen:
- **Stateless frontend**: bewaart geen server-side state, waardoor de load balancer willekeurig kan verdelen over Flask-replicas
- **Lazy loading**: routes worden pas geladen wanneer nodig, wat de initiële bundle kleiner houdt
- **Modulaire opbouw**: standalone components en feature modules maken onafhankelijke scaling mogelijk
- **Onafhankelijke deploy**: frontend kan op een andere server/CDN draaien dan de backend

## Consequences

**Positief:**
- Angular's decoupled architectuur zorgt ervoor dat de frontend beschikbaar blijft ongeacht de backend-status
- TypeScript en form validators voorkomen ongeldige data bij de bron, wat de Integrity POC versterkt
- JWT-interceptors en route guards bieden directe integratie met Keycloak zonder extra configuratie
- Stateless ontwerp maakt horizontale schaalbaarheid van de backend mogelijk



