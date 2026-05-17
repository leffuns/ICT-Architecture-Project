# POC Availability
> ### Automatische health checking, rerouting en herstarten bij vastlopende instanties

## Wat bewijst mijn POC precies?

1. Er worden 3 replica's van de monoliet gestart op het 5-node cluster (waarbij automatisch 1 node vrij blijft als spare capacity).
2. Er wordt een crash gesimuleerd op 1 replica via een `POST /fail` request.
3. Dit toont aan dat het systeem bereikbaar blijft via de andere werkende replica's.
4. Ook herstart de Swarm de falende replica automatisch zodra de health check een fout detecteert.

## details
- Docker Swarm cluster (3 managers, 2 workers)
- 3 replica's van de `booking-api` verspreid over de nodes
- 1 MySQL database draaiend op een manager node
- 1 spare capacity node

## Opstarten

```powershell
docker swarm init
cd POC3-AVAILABILITY
docker build -t poc-booking-api:latest ./booking-api
docker stack deploy --compose-file poc.yaml poc
```

Wacht 1 minuut en voer dit uit tot je `3/3` en `1/1` ziet:

```powershell
docker service ls
```


## Stap 1 Bekijk welke containers er draaien

```powershell
docker service ps poc_booking-api
```

Je ziet normaal 3 regels zonder `\_` dat betekent dat alle 3 containers opgestart zijn, er is nog geen geschiedenis van vorige containers.

```
poc_booking-api.1   Running
poc_booking-api.2   Running
poc_booking-api.3   Running
```

## Stap 2 Doe een request en zie welke replica antwoordt

```powershell
(Invoke-WebRequest http://localhost:8080/hostname -UseBasicParsing).Content
```

Je krijgt zoiets:

```
{"count":1,"hostname":"a9516f781e5c"}
```

## Stap 3 Crash een replica met fail

```powershell
Invoke-WebRequest -Uri http://localhost:8080/fail -Method POST -UseBasicParsing | Select-Object -ExpandProperty Content
```

Je krijgt:

```
{"hostname":"e96ceb3bfc7a","message":"Service is now unhealthy"}
```

De replica met die hostname is nu kapot. De health check van Docker detecteert dit.

## Stap 4 Kijk of je toch nog een response krijgt

```powershell
(Invoke-WebRequest http://localhost:8080/bookings -UseBasicParsing).Content
```

Normaal krijg je alsnog data van een andere replica. De gebruiker zal niets merken van de crash.

## Stap 5 Wacht 1 minuut

elke 10 seconden wordt een health check uitgevoerd. Na 3 mislukte checks 30 seconden markeert Swarm de container als unhealthy en wordt er automatisch een nieuwe opgestart.

## Stap 6 Bekijk opnieuw welke containers er draaien

```powershell
docker service ps poc_booking-api
```

Je ziet nu een `\_` verschijnen bij een replica:
```
poc_booking-api.1   Running               ← actief
poc_booking-api.2   Running               ← actief
poc_booking-api.3   Running 20 sec ago    ← nieuw
 \_ poc_booking-api.3   Shutdown          ← de gecrasht container
```

De `\_` is de geschiedenis: Swarm toont hier de oude, kapotte container die we crashte.

Dit bewijst dat Swarm de kapotte replica heeft gedetecteerd en vervangen zonder dat je iets hoeft te doen.

## afsluiten

```powershell
docker stack rm poc
docker volume rm poc_db-data
docker swarm leave --force
```
