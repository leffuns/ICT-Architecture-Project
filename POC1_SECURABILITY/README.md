# POC 1: OIDC authenticatie en autorisatie
## Wat bewijst deze POC?
1. Dat we login en rechten niet zelf bouwen, maar overlaten aan Keycloak.
2. De backend weigiert een gebruiker zonder een (geldig) token.
3. De backend kan een geldig token herkennen.
4. De backend kan een geldig rol herkennen.

## Setup
Deploy de stack:

```bash
docker stack deploy -c poc.yaml poc
```

Wacht 30 à 60 seconden op de eerste start. 

Status checken:

```bash
docker service logs poc_keycloak --follow
```
Wacht tot er een lijn verschijnt met 'Listening on ...'.

## Testen

### Stap 1: Log in als Alice (een gewone gebruiker) en haal een token op.

```bash
TOKEN=$(curl -s -X POST \
  http://localhost:8080/realms/sportbooking/protocol/openid-connect/token \
  -d "client_id=sportbooking-app" \
  -d "username=alice" -d "password=alice123" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
```

### Stap 2: Public endpoint testen (geen token nodig)

```bash
curl http://localhost:9000/open
# {"bericht":"Dit mag iedereen zien."}
```

### Stap 3: Authenticated endpoint zonder token

```bash
curl http://localhost:9000/mijn-profiel
# {"detail":"Geen token meegestuurd"}   (foutcode 401)
```

### Stap 4: Met Alice's token kom je wel binnen

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9000/mijn-profiel
# {"bericht":"Hallo alice, je bent ingelogd."}
```

### Stap 5: Alice mag niet in het clubbeheer

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9000/club-beheer
# {"detail":"Je hebt de rol 'club_admin' nodig."}   (foutcode 403)
```

### Stap 6: Bob is wel clubbeheerder

```bash
TOKEN_BOB=$(curl -s -X POST \
  http://localhost:8080/realms/sportbooking/protocol/openid-connect/token \
  -d "client_id=sportbooking-app" \
  -d "username=bob" -d "password=bob123" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN_BOB" http://localhost:9000/club-beheer
# {"bericht":"Welkom in het clubbeheer, bob."}
```

## Opruimen
```bash
docker stack rm poc
```

## Opmerkingen
- Alle wachtwoorden zijn nep en staan bewust gewoon in de bestanden. In een echte applicatie gebruiken we Docker Swarm secrets.
- We gebruiken hier de `password`-flow omdat die makkelijk met `curl` te tonen is. In de echte applicatie loopt login via de browser (Authorization Code Flow). Keycloak ondersteunt beide; voor een POC kiezen we de testbare.
- Keycloak draait in `start-dev`-modus (geen HTTPS). Dit is bedoeld om het idee te bewijzen, maar niet voor productie.