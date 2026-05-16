## How to start

Activeer de swarm:

```
docker swarm init
```

Start de stack:

```
docker stack deploy -c poc.yaml poc
```

(`-f` werkt niet, gebruik `-c`)

## How to test

Voer in de terminal:

```
docker ps
```

gebruik de <CONTAINER_ID> van de `docker ps`:

```
docker exec -it <CONTAINER_ID> python app.py
```

Nu krijg je de logs, erin zie je dat twee requests gebeuren, maar dat er een lock wordt geplaatsd zodat maar 1 geldig is.

## How to stop

Verwijder de stack:

```
docker stack rm poc
```

Verlaat de swarm:

```
docker swarm leave --force
```