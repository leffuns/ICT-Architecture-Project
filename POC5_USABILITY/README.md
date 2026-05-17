# POC 5: Usability

## Setup

Bouw eerst de Angular Docker-image lokaal:
```bash
docker build -t angular-app:latest .
```

Start daarna de stack in Docker Swarm:
```bash
docker stack deploy -c poc.yaml poc
```

*(Merk op: als je cluster `-f` in plaats van `-c` verwacht voor stack deploys, gebruik dan `docker stack deploy -f poc.yaml poc`)*

## Testen

Open je browser en navigeer naar:
`http://localhost:4200/`

## Opruimen

Verwijder de stack uit het cluster:
```bash
docker stack rm poc
```