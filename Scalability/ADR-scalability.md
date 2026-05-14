# ADR: Horizontale Scaling via Docker Swarm

## Context

Het sportterrein-reserveringsplatform (vergelijkbaar met Playtomic) verwacht sterk variërend verkeer op meerdere dimensies:

- **Dagelijkse pieken**: werkdagen tussen 17:00 en 22:00, wanneer de meeste spelers na het werk willen reserveren, en in het weekend de volledige dag.
- **Seizoensgebonden**: het voorjaar en de zomer genereren aanzienlijk meer boekingen dan de wintermaanden, vooral voor buitenterreinen (tennis, padel).
- **Event-driven pieken**: wanneer een club een toernooi organiseert, een promotie lanceert, of een nieuw terrein opent, kan het verkeer plotseling verveelvoudigen.
- **Groei over tijd**: naarmate meer clubs en gebruikers het platform adopteren, moet de baseline-capaciteit meegroeien.

De applicatie moet deze variatie kosten-efficiënt opvangen: opschalen tijdens pieken om gebruikerservaring te garanderen, en afschalen tijdens daluren om onnodige infrastructuurkosten te vermijden.

### Beperkingen

- **Team**: 5 afgestudeerden
- **Tijdsbestek**: half jaar tot productie
- **Budget**: beperkt
- **Opdracht-eis**: POC's moeten draaien via `docker stack deploy`

## Decision

We kiezen voor **horizontale scaling via Docker Swarm** met service-replicatie als primaire scalability-strategie.

### Waarom horizontale scaling?

Bij horizontale scaling voegen we meer instanties (containers) toe van een service, in plaats van de bestaande server krachtiger te maken. Dit biedt:

1. **Geen hard plafond**: we kunnen blijven bijschalen zolang we nodes toevoegen.
2. **Fault tolerance**: als één replica faalt, nemen de anderen het over.
3. **Kosten-efficiëntie**: we betalen alleen voor de capaciteit die we nodig hebben op dat moment.

### Waarom Docker Swarm?

Docker Swarm is de ingebouwde orchestratie-engine van Docker en biedt:

- **Lage instapdrempel**: geen extra tooling nodig, Swarm is ingebouwd in Docker Engine.
- **Service replicatie**: via `deploy.replicas` in het compose-bestand kunnen we eenvoudig het aantal instanties instellen.
- **Ingebouwde load balancing**: Swarm's ingress network verdeelt automatisch inkomend verkeer over alle healthy replicas via round-robin.
- **Rolling updates**: bij een nieuwe versie van de API worden replicas één voor één vervangen, zonder downtime.
- **Health checks**: ongezonde containers worden automatisch herstart (self-healing).
- **Past bij de opdracht**: de POC-eis is `docker stack deploy -f poc.yaml poc`, wat exact het Swarm deploy-mechanisme is.

### Concrete aanpak

1. **Stateless API-services**: de booking-API en eventuele frontend zijn stateless ontworpen — er wordt geen sessie-informatie in de container opgeslagen. Hierdoor zijn alle replicas volledig inwisselbaar en kan verkeer naar elke willekeurige replica gerouteerd worden.

2. **Replicatie via Stack**: in het `poc.yaml` bestand wordt `deploy.replicas: 3` ingesteld. Opschalen gebeurt met `docker service scale poc_booking-api=N`.

3. **Database-integriteit**: omdat meerdere API-replicas tegelijk dezelfde database benaderen, gebruiken we `SELECT ... FOR UPDATE` (pessimistic locking) op de booking-transacties om race conditions en dubbele boekingen te voorkomen.

4. **Resource limits**: elke replica krijgt resource-limieten (`cpus: 0.5`, `memory: 256M`) om te voorkomen dat één overbelaste replica de hele node beïnvloedt.

## Alternatives Considered

### 1. Kubernetes
**Voordelen:**
- Automatische scaling op basis van metrics (Horizontal Pod Autoscaler).
- Rijk ecosysteem aan tools voor monitoring, service mesh en security.
- Zeer geavanceerde self-healing en deployment strategieën.

**Nadelen:**
- Zeer hoge complexiteit en een steile leercurve voor het team.
- Significante operationele overhead (beheer van cluster, ingress, RBAC).
- Te zwaar middel voor een team van 5 personen binnen dit tijdsbestek.

**Conclusie**: Kubernetes is de logische volgende stap bij extreme groei, maar voor nu wegen de nadelen (complexiteit) zwaarder dan de voordelen.

### 2. Verticaal schalen (grotere servers)
**Voordelen:**
- Zeer eenvoudig te implementeren: simpelweg meer CPU/RAM toewijzen.
- Geen architecturale aanpassingen nodig (applicatie hoeft niet stateless te zijn).

**Nadelen:**
- Er is een hard plafond (maximale servergrootte).
- Geen redundantie: als de server faalt, ligt alles plat.
- Disproportioneel duurder bij hogere capaciteit.
- Niet flexibel genoeg voor sterk variërend verkeer.

**Conclusie**: Niet geschikt voor een modern platform dat hoge beschikbaarheid en kostenefficiëntie vereist.

### 3. Serverless (AWS Lambda / Google Cloud Functions)
**Voordelen:**
- Perfecte automatische scaling (pay-per-invocation).
- Geen serverbeheer nodig.

**Nadelen:**
- Sterke vendor lock-in aan één specifieke cloudprovider.
- Last van "cold starts" (latentie bij eerste aanroep), wat problematisch is voor real-time boekingen.
- Complex database-connectiebeheer.
- Voldoet niet aan de opdracht-eis voor Docker orchestratie.

**Conclusie**: Hoewel technisch interessant voor specifieke taken, is het als hoofdarchitectuur niet passend voor dit project.

### 4. Monolithisch (geen scaling-strategie)
**Voordelen:**
- Eenvoudigste vorm van ontwikkeling en deployment.

**Nadelen:**
- Onmogelijk om pieken op te vangen zonder downtime of extreme traagheid.
- Geen mogelijkheid tot gesegmenteerde groei of fault tolerance.

**Conclusie**: Onacceptabel risico voor een commercieel boekingsplatform.

## Consequences

### Positief

- **Eenvoudige horizontale scaling**: `docker service scale` is één commando om op te schalen.
- **Past bij het team**: Docker Swarm vereist geen specialistische Kubernetes-kennis.
- **Past bij de opdracht**: dezelfde tooling voor POC en productie.
- **Kosten-efficiënt**: schaal af buiten piekuren, schaal op wanneer nodig.
- **Fault tolerance**: als een replica crasht, verdeelt Swarm het verkeer over de resterende replicas en start een nieuwe op.

### Negatief

- **Geen automatische scaling out-of-the-box**: Docker Swarm heeft geen ingebouwde auto-scaler op basis van metrics. Dit vereist ofwel een externe tool (bijv. Orbiter) of handmatige scaling/scripting.
- **Beperkt ecosysteem**: minder tooling en community-support dan Kubernetes.
- **Migratiepad**: bij extreme groei (honderden microservices, duizenden nodes) zou een migratie naar Kubernetes nodig zijn. De stateless architectuur maakt die migratie wel eenvoudiger.

## Bij groter team / budget

| Factor | Andere beslissing |
|--------|-------------------|
| Team >10 developers | Kubernetes met HPA (auto-scaling) |
| Dedicated SRE-rol | Kubernetes + service mesh (Istio/Linkerd) |
| Multi-cloud strategie | Kubernetes (cloud-agnostisch) |
| Onbeperkt budget | Managed Kubernetes (EKS/GKE/AKS) + auto-scaling + CDN |

## POC Resultaten & Validatie

De bovenstaande architecturale beslissing is gevalideerd middels een technische Proof of Concept op 12 mei 2026. De resultaten bevestigen de gestelde hypotheses:

### 1. Horizontale Schaalbaarheid (Throughput)
Door het aantal replicas te verhogen in de Docker Swarm stack, steeg de verwerkingscapaciteit van de API:

| Aantal Replicas | Requests per seconde (gem.) | Gemiddelde Latency |
|-----------------|-----------------------------|--------------------|
| 3 Replicas      | 27.7 req/sec                | 1.67 sec           |
| 10 Replicas     | 31.8 req/sec                | 1.47 sec           |

*Opmerking: De winst is niet lineair door de gedeelde PostgreSQL database op één fysieke node, wat in deze POC het bottleneck-punt vormde. In een multi-node productie-omgeving met een managed database zou de winst groter zijn.*

### 2. Load Balancing
Testen met 20 opeenvolgende requests toonden aan dat Docker Swarm het verkeer effectief verdeelde over alle actieve replicas (gevalideerd via hostname-inspectie).

### 3. Data Integriteit (Concurrency Control)
Het kritieke onderdeel van de POC — het voorkomen van dubbele boekingen bij hoge gelijktijdige belasting — is succesvol gevalideerd:
- **Test**: 30 gelijktijdige boekingspogingen voor exact hetzelfde tijdslot via verschillende replicas.
- **Resultaat**: Exact 1 boeking slaagde (HTTP 201), 29 boekingen werden geweigerd (HTTP 409 Conflict).
- **Conclusie**: De pessimistische locking-strategie (`SELECT FOR UPDATE`) werkt correct in een geschaalde omgeving.

## Referenties

- Docker Swarm documentatie: https://docs.docker.com/engine/swarm/
- ADR-formaat gebaseerd op Michael Nygard's template: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- Richards, M. & Ford, N. (2020). *Fundamentals of Software Architecture*. O'Reilly Media. — Hoofdstuk over architecturale karakteristieken en trade-offs.
