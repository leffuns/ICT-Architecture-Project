# Proof of Concept: Scalability

## Doel

Deze Proof of Concept beantwoordt de volgende technische vraag:

**Kan een booking-API voor sportterreinreserveringen horizontaal schalen via Docker Swarm replicas, terwijl data-integriteit (geen dubbele boekingen) behouden blijft onder gelijktijdige belasting?**

## Architectuur

```
                    ┌─────────────────────────────┐
                    │     Docker Swarm Cluster     │
                    │                              │
   HTTP :8080  ───▶ │   ┌─── Ingress Load ───┐    │
                    │   │     Balancer         │    │
                    │   └──┬──────┬──────┬─────┘   │
                    │      │      │      │          │
                    │   ┌──▼──┐┌──▼──┐┌──▼──┐      │
                    │   │ API ││ API ││ API │       │
                    │   │  1  ││  2  ││  3  │       │
                    │   └──┬──┘└──┬──┘└──┬──┘      │
                    │      │      │      │          │
                    │   ┌──▼──────▼──────▼──┐      │
                    │   │   PostgreSQL DB    │      │
                    │   │  (SELECT FOR UPDATE│      │
                    │   │   = geen dubbele   │      │
                    │   │     boekingen)     │      │
                    │   └───────────────────┘      │
                    └─────────────────────────────┘
```

### Overzicht van de Componenten

#### Booking API
Deze REST API (gebouwd met **Python Flask** en **Gunicorn**) vormt de kern van de POC. Het handelt de logica voor het bekijken en boeken van tijdslots af. In onze opstelling draait deze service met meerdere replicas achter de Docker Swarm load balancer om de horizontale schaalbaarheid aan te tonen.

#### Database
We gebruiken **PostgreSQL 15** voor de persistente opslag. De database is cruciaal voor de data-integriteit; door middel van `SELECT ... FOR UPDATE` zorgen we ervoor dat rijen vergrendeld worden tijdens een transactie, wat race-conditions voorkomt.

#### Loadtest Container
Dit is een hulp-container gebaseerd op **Alpine** met tools zoals `hey` en `curl`. Hiermee vuren we geautomatiseerde tests af op de API om te meten hoe de load balancing en throughput zich gedragen onder druk.

## Vereisten

- Docker Engine met Swarm mode geactiveerd
- De testcluster telt 3 managers en 2 workers (zoals in de opdracht)

## Opstarten

### Stap 1: Initialiseer Docker Swarm (als dat nog niet gebeurd is)

```bash
docker swarm init
```

### Stap 2: Bouw de Docker images

Bouw de images lokaal zodat Swarm ze kan gebruiken:
```bash
docker build -t poc-booking-api:latest ./booking-api
docker build -t poc-loadtest:latest ./loadtest
```

### Stap 3: Deploy de stack

Gebruik de compose-vlag `-c` om de stack te starten:
```bash
docker stack deploy -c poc.yaml poc
```

### Stap 4: Controleer of alles draait

```bash
docker service ls
```

Je zou moeten zien:
```
ID         NAME               MODE         REPLICAS   IMAGE
...        poc_booking-api    replicated   3/3        poc-booking-api:latest
...        poc_db             replicated   1/1        postgres:15-alpine
...        poc_loadtest       replicated   1/1        poc-loadtest:latest
```

Wacht tot alle replicas `3/3` tonen (kan 15-30 seconden duren door health checks).

## Tests Uitvoeren

### Geautomatiseerde tests

Exec in de loadtest container en voer het script uit:

```bash
docker exec -it $(docker ps -q -f name=poc_loadtest) /bin/sh -c "./run-test.sh"
```

Het script voert drie tests uit:

1. **Load Balancing Verificatie**: Stuurt 20 requests naar `/info` en toont welke replica elk verzoek afhandelt. Bij meerdere replicas verschijnen er verschillende hostnames.

2. **Throughput Test**: Stuurt 500 requests met 50 gelijktijdige connecties naar `GET /slots` en meet requests/seconde.

3. **Concurrency / Data Integriteit Test**: Stuurt 30 gelijktijdige boekingsverzoeken naar hetzelfde tijdslot. Precies 1 boeking mag slagen (HTTP 201), de rest moet een conflict krijgen (HTTP 409).

### Handmatige tests

Je kan ook handmatig de API testen:

```bash
# Bekijk beschikbare terreinen
curl http://localhost:8080/courts

# Bekijk beschikbare slots
curl http://localhost:8080/slots

# Bekijk slots voor een specifiek terrein
curl http://localhost:8080/slots?court_id=1

# Boek een tijdslot
curl -X POST http://localhost:8080/book \
  -H "Content-Type: application/json" \
  -d '{"slot_id": 1, "user": "Jef"}'

# Controleer welke replica het verzoek afhandelt
curl http://localhost:8080/info

# Reset alle boekingen (voor herhaalde tests)
curl -X POST http://localhost:8080/reset
```

## Scalability Demonstratie

### Het kernexperiment

Dit is het belangrijkste onderdeel: we tonen aan dat meer replicas → hogere throughput.

```bash
# 1. Bekijk de huidige situatie (3 replicas)
docker service ls

# 2. Voer de load test uit en noteer de "Requests/sec" waarde
docker exec -it $(docker ps -q -f name=poc_loadtest) /bin/sh -c "./run-test.sh"

# 3. Schaal af naar 1 replica
docker service scale poc_booking-api=1

# 4. Wacht tot de scaling voltooid is
docker service ls

# 5. Voer dezelfde load test opnieuw uit
docker exec -it $(docker ps -q -f name=poc_loadtest) /bin/sh -c "./run-test.sh"

# 6. Schaal op naar 5 replicas
docker service scale poc_booking-api=5

# 7. Voer de load test nogmaals uit
docker exec -it $(docker ps -q -f name=poc_loadtest) /bin/sh -c "./run-test.sh"
```

### Verwachte resultaten

Bij het uitvoeren van de schaalbaarheidstest verwachten we de volgende trends:
*   **1 Replica:** Dit is onze baseline. We verwachten een normale throughput en zien slechts één hostname terugkomen in de logs van de load balancer.
*   **3 Replicas:** De throughput zou ongeveer 2 tot 3 keer hoger moeten liggen dan de baseline. De requests worden hierbij verdeeld over drie verschillende containers.
*   **5 Replicas:** Hier verwachten we de maximale winst (ongeveer 4 tot 5 keer de baseline), afhankelijk van de belasting op de PostgreSQL database.

### Data integriteit bij alle schaalgroottes

De concurrency test (Test 3) moet bij **elke** schaalgrootte hetzelfde resultaat geven:
- Precies 1 succesvolle boeking (HTTP 201)
- 29 conflicten (HTTP 409)
- 0 fouten

Dit bewijst dat de `SELECT ... FOR UPDATE` strategie correct werkt, ongeacht het aantal actieve replicas.

## Technische Beslissingen

Tijdens het ontwerpen van deze POC hebben we de volgende keuzes gemaakt:

*   **Flask + Gunicorn:** Deze stack is snel op te zetten. Gunicorn biedt meerdere workers per container (verticale schaling), terwijl Swarm de horizontale schaling tussen de containers overneemt.
*   **PostgreSQL:** Een betrouwbare, ACID-compliant database is essentieel voor correcte boekingslogica.
*   **Pessimistic locking:** Door gebruik te maken van `SELECT ... FOR UPDATE` garanderen we dat er nooit twee mensen tegelijkertijd hetzelfde tijdslot kunnen claimen, zelfs niet als ze via verschillende API-replicas binnenkomen.
*   **Stateless API:** De containers slaan geen lokale status of sessies op. Hierdoor kan elk verzoek door elke willekeurige replica worden afgehandeld, wat horizontale schaling mogelijk maakt.
*   **Docker Swarm:** Swarm is de gevraagde technologie voor de POC. Het is eenvoudiger te beheren dan Kubernetes, maar biedt alle nodige functies voor service-replicatie en load balancing.
