# ADR: Horizontale Scaling via Docker Swarm

## Context

Het sportterrein-reserveringsplatform verwacht sterk variërend verkeer. Conform de groepsbeslissing in ADR 1 gebruiken we een **Modulaire Monoliet** architectuur. Voor de scalability focus ik op het horizontaal schalen van deze monoliet om de load op het systeem op te vangen.

- **Dagelijkse pieken**: werkdagen tussen 17:00 en 22:00.
- **Seizoensgebonden**: meer boekingen in de zomer.
- **Groei over tijd**: baseline-capaciteit moet meegroeien.

De applicatie moet deze variatie kosten-efficiënt opvangen door de volledige monoliet-instanties op te schalen tijdens pieken.

### Beperkingen

- **Team**: 5 afgestudeerden
- **Tijdsbestek**: half jaar tot productie
- **Opdracht-eis**: POC's via `docker stack deploy`

## Decision

We kiezen voor **horizontale scaling van de modulaire monoliet via Docker Swarm**.

### Waarom een Modulaire Monoliet voor Scalability?

Hoewel de applicatie als één unit wordt gedeployed, biedt de modulaire opbouw voordelen voor schaalbaarheid:
1.  **Eenvoudige Replicatie**: We kunnen de volledige monoliet (inclusief alle modules zoals Booking, Catalog, etc.) eenvoudig meerdere keren draaien. Swarm zorgt voor de load balancing.
2.  **Stateless design**: Door de monoliet stateless te maken, kan de load balancer (Docker Swarm) verkeer verdelen zonder dat sessies verloren gaan. Dit maakt het opschalen naar $N$ replicas triviaal.
3.  **Toekomstgericht**: Mocht een specifieke module in de toekomst extreem veel load krijgen, dan kan deze dankzij de modulaire opzet eenvoudig worden losgekoppeld als aparte microservice.

### Waarom Docker Swarm?

- **Lage instapdrempel**: Ingebouwd in Docker Engine.
- **Service replicatie**: Eenvoudig via `deploy.replicas`.
- **Ingebouwde load balancing**: Ingress network verdeelt verkeer via round-robin.
- **Health checks**: Automatisch herstel van de monoliet-instanties.

### Concrete aanpak

1.  **Stateless Monoliet**: De applicatie is volledig stateless ontworpen. Alle status (zoals boekingen) wordt opgeslagen in de gedeelde database.
2.  **MySQL 8.0**: We gebruiken MySQL (conform de teamkeuze) als gedeelde database.
3.  **Pessimistic Locking**: Om dubbele boekingen te voorkomen in een omgeving met meerdere replicas, gebruiken we `SELECT ... FOR UPDATE` in MySQL transacties op het niveau van de Booking module.
4.  **Resource limits**: Elke replica krijgt resource-limieten (`cpus: 0.5`, `memory: 256M`).

## Alternatives Considered

### 1. Kubernetes
Te complex voor een klein team van 5 personen binnen 6 maanden. Swarm biedt alle nodige functies voor service-replicatie en load balancing met minder overhead.

### 2. Verticaal schalen
Niet redundant en heeft een hard plafond. Biedt geen oplossing voor hoge beschikbaarheid (Availability).

### 3. Microservices
Hoewel microservices gericht schalen van specifieke modules mogelijk maken, brengt het te veel complexiteit en communicatie-overhead met zich mee voor ons huidige team en tijdsbestek (zie ADR 1). De modulaire monoliet biedt een betere balans tussen ontwikkelingssnelheid en schaalbaarheid.

## Consequences

### Positief
- **Eenvoudige horizontale scaling**: `docker service scale` is één commando om op te schalen.
- **Fault tolerance**: Als een replica crasht, verdeelt Swarm het verkeer over de resterende replicas.
- **Consistentie**: De hele applicatie schaalt op dezelfde manier.

### Negatief
- **Resource gebruik**: We schalen ook modules op die misschien geen extra load hebben (zoals de Catalog-module als alleen de Booking-module druk is).
- **Database bottleneck**: Alle replicas praten tegen één MySQL database. Bij extreme groei moet ook de database-laag geschaald worden.

## POC Resultaten & Validatie

### 1. Horizontale Schaalbaarheid (Throughput)
Door het aantal replicas van de monoliet te verhogen, steeg de verwerkingscapaciteit:

| Aantal Replicas | Requests per seconde (gem.) | Gemiddelde Latency |
|-----------------|-----------------------------|--------------------|
| 3 Replicas      | 27.7 req/sec                | 1.67 sec           |
| 10 Replicas     | 31.8 req/sec                | 1.47 sec           |

### 2. Load Balancing
Docker Swarm verdeelt verkeer effectief over de verschillende monoliet-replicas.

### 3. Data Integriteit (Concurrency Control)
Gevalideerd met 30 gelijktijdige boekingspogingen in een MySQL omgeving:
- **Resultaat**: Exact 1 boeking slaagde (201), 29 geweigerd (409).
- **Conclusie**: De `SELECT FOR UPDATE` strategie in MySQL werkt correct voor horizontaal geschaalde monolieten.

## Referenties

- Docker Swarm: https://docs.docker.com/engine/swarm/
- MySQL Concurrency: https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html
- Nygard, M. (2011). *Documenting Architecture Decisions*.
