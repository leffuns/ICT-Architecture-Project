# POC 1: OIDC authenticatie en autorisatie
## Wat bewijst deze POC?
Dat de architecturale keuze uit ADR 1 in de praktijk werkt op onze
infrastructuur (Docker Swarm):

1. Keycloak draait in HA-modus — twee instanties die elkaar automatisch vinden, zodat één uitval het systeem niet platlegt.
2. Onze backend controleert tokens lokaal, zonder bij elke aanvraag Keycloak te hoeven raadplegen.
3. Toegangscontrole op basis van rollen werkt via één centrale plek.
4. De realm-configuratie zit in versiebeheer en wordt automatisch geladen bij elke deployment.

## Setup
Maak eerst twee geheime wachtwoorden aan:

```bash
echo -n "kc_db_pw_changeme" | docker secret create kc_db_password -
echo -n "kc_admin_pw_changeme" | docker secret create kc_admin_password -
```

Deploy de stack:

```bash
docker stack deploy --compose-file poc.yaml poc
```

Wacht 30 à 60 seconden op de eerste start (Keycloak importeert de realm en
beide replica's vormen het cluster). 

Status checken:

```bash
docker stack ps poc
docker service logs poc_keycloak --tail 20
```

## De flow testen

### Stap 1 — JWT ophalen via password grant

Drie testgebruikers, één per rol:

| User   | Password   | Rollen                           |
|--------|------------|----------------------------------|
| alice  | alice123   | end_user                         |
| bob    | bob123     | end_user, club_admin             |
| carol  | carol123   | end_user, platform_admin         |

```bash
TOKEN_ALICE=$(curl -s -X POST \
  http://localhost:8080/realms/sportbooking/protocol/openid-connect/token \
  -d "client_id=sportbooking-app" \
  -d "username=alice" \
  -d "password=alice123" \
  -d "grant_type=password" | jq -r .access_token)

echo "$TOKEN_ALICE" | cut -c1-60   # toont de header van het JWT
```

### Stap 2 — Public endpoint (geen token nodig)

```bash
curl http://localhost:9000/public
# → {"message":"Hello from the sportbooking platform"}
```

### Stap 3 — Authenticated endpoint

```bash
curl -H "Authorization: Bearer $TOKEN_ALICE" http://localhost:9000/me
# → {"username":"alice","roles":["end_user","default-roles-sportbooking",...]}
```

Zonder token:

```bash
curl http://localhost:9000/me
# → 401 Missing or malformed Authorization header
```

### Stap 4 — Role-based access in actie

Alice (alleen `end_user`) mag niet op de club-dashboard:

```bash
curl -H "Authorization: Bearer $TOKEN_ALICE" \
     http://localhost:9000/club-admin/dashboard
# → 403 Missing required role: club_admin
```

Bob (`club_admin`) wel:

```bash
TOKEN_BOB=$(curl -s -X POST \
  http://localhost:8080/realms/sportbooking/protocol/openid-connect/token \
  -d "client_id=sportbooking-app" -d "username=bob" -d "password=bob123" \
  -d "grant_type=password" | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN_BOB" \
     http://localhost:9000/club-admin/dashboard
# → 200 met dashboard-data
```

Bob mag echter niet op het platform-admin endpoint, ook al heeft hij twee
rollen:

```bash
curl -H "Authorization: Bearer $TOKEN_BOB" http://localhost:9000/admin/users
# → 403 Missing required role: platform_admin
```

Carol (`platform_admin`) wel.

### Stap 5 — Browser-flow (optioneel)

De Keycloak admin-console: <http://localhost:8080/admin> — login met `admin` /
het wachtwoord uit `kc_admin_password`. Open daar de realm `sportbooking` en
inspecteer rollen, users en de client `sportbooking-app`.

Voor de Authorization Code Flow met PKCE (zoals in productie de SPA dit doet)
kan je [oidcdebugger.com](https://oidcdebugger.com) gebruiken — werkt enkel
als Keycloak via een publiek bereikbare URL draait, dus enkel zinvol op de
testcluster, niet via `localhost`.

## High Availability demonstreren

Bekijk de placement van Keycloak-replica's:

```bash
docker service ps poc_keycloak
# → NODE-kolom toont 2 verschillende nodes
```

Eén van de Keycloak-nodes draineren (simuleert node-uitval):

```bash
KC_NODE=$(docker service ps poc_keycloak --format "{{.Node}}" | head -1)
docker node update --availability drain $KC_NODE
```

Token ophalen blijft werken — Swarm's ingress network routeert nu alle requests
naar de overlevende instance:

```bash
curl -s -X POST \
  http://localhost:8080/realms/sportbooking/protocol/openid-connect/token \
  -d "client_id=sportbooking-app" -d "username=alice" -d "password=alice123" \
  -d "grant_type=password" | jq -r .access_token | cut -c1-60
```

Node terugzetten:

```bash
docker node update --availability active $KC_NODE
```

## Opruimen

```bash
docker stack rm poc
docker secret rm kc_db_password kc_admin_password
docker volume rm poc_keycloak-db-data   # optioneel; wist alle accounts
```