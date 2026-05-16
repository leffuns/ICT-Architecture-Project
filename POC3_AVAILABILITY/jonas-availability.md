# Plan: Availability sportterrein reserveringsplatform
> **Hoe garanderen dat het sportterrein-reserveringsplatform beschikbaar blijft wanneer een instantie crashed of uitvalt, zonder dat de gebruiker iets merkt?**

### Karakteristieken

**4. Availability**
Gebruikers moeten 24/7 kunnen boeken en clubs moeten altijd toegang hebben tot hun terreinbeheer. downtime leidt direct tot omzetverlies. Voor het platform streven we naar een **99.9% uptime**.

---

### Componenten

**1. Identiteitsbeheer**
*   **Workflow:** Gebruikers loggen in om hun gegevens en boekingen te beheren.
*   **Availability-taak:** Het implementeren van stateless authenticatie via JWT-tokens. Hierdoor hoeft er geen sessie-informatie gedeeld te worden tussen replica's, wat naadloze failover mogelijk maakt als een instantie herstart.

**2. Terreinen huren**
*   **Workflow:** Een gebruiker selecteert een tijdslot en plaatst een tijdelijke reservatie.
*   **Availability-taak:** Het garanderen van data-integriteit tijdens een failover. Ik zorg dat we **Optimistic Locking** gebruiken in MySQL om dit te voorkomen.

**3. Betalingsbeheer**
*   **Workflow:** De gebruiker rekent de reservatie af via een externe provider.
*   **Availability-taak:** Het verwerken van betalingsbevestigingen (webhooks) op een idempotente manier. Zelfs als het netwerk hapert of een component herstart, wordt een betaling nooit dubbel verwerkt.

**4. Boekingoverzicht**
*   **Workflow:** Clubs ontvangen notificaties van nieuwe boekingen.
*   **Availability-taak:** Gebruikmaken van asynchrone verwerking. Indien de notificatiemodule tijdelijk onbeschikbaar is, worden berichten in een wachtrij (queue) geplaatst zodat ze niet verloren gaan en verwerkt worden zodra de module weer online is.

---

## Hoe availability zich verhoudt tot andere karakteristieken

| Karakteristiek | Relatie |
|---|---|
| **Integrity** (Angeles) | Bij failover mogen geen dubbele boekingen ontstaan. Ik zorg dat we **Optimistic Locking** gebruiken in MySQL om dit te voorkomen. |
| **Scalability** (Viktor) | Meer replica's kunnen ook gebruikt worden voor betere availability door de heathchecks en rerouting en ook voor betere performance onder load. |
| **Responsiveness** (Hajar) | de health checks hebben een interval van 10s. Dit heb ik gedaan voor de balans tussen snelle detectie van falen en niet teveel  belasten van de service. |

---

## ADR: Aantal replica's in productie (n=3) + 1 spare capacity voor beschikbaarheid
### Status
Goedgekeurd

### Context
Om een uptime van 99.9% te halen, mag het systeem geen Single Point of Failure hebben. Als we slechts 1 instantie van de applicatie draaien en deze crasht of loopt vast, dan is het platform down voor alle gebruikers en leidt dit direct tot omzetverlies. er is een strategie nodig waarbij meerdere instanties tegelijk draaien zodat als er een wegvalt een andere instantie dit kan opvangen.

### Decision
Ik heb besloten om standaard **3 replica's** van de modulaire monoliet horizontaal te schalen in het Docker Swarm cluster met 1 spare capacity node. Hierdoor detecteert het systeem automatisch via health checks wanneer een instantie faalt, waarna het verkeer direct wordt omgeleid naar een werkende replica zodat de gebruiker gewoon kan doorgaan.

1.  **Redundantie:** Door 3 replica's te gebruiken, kan er één instantie uitvallen terwijl de andere twee de volledige load blijven opvangen.
2.  **Health Checking & Rerouting:** In combinatie met Docker Swarm worden replica's die vastlopen of gecrashed zijn automatisch gedetecteerd. Het verkeer wordt dan via rerouting onmiddellijk naar de overgebleven gezonde replica's gestuurd.
3.  **Self-healing:** Terwijl de gezonde replica's het verkeer afhandelen, herstart Swarm de gefaalde instantie, waardoor we na korte tijd weer op volledige capaciteit draaien.

### Alternatives Considered
*   **1 Replica:** Geen redundantie; bij elke fout ligt het hele platform plat.
*   **2 Replica's:** Als er één uitvalt, moet de overblijvende instantie plotseling 100% meer verkeer verwerken, wat kan leiden tot een tweede crash. 3 replica's biedt een veiligere marge.
*   **Microservices:** Een modulaire monoliet is 'beginner-friendlier' en vind ik beter passen bij deze opdracht.

### Consequences
*   **Positief:** Automatisch herstel van crashes binnen 30-40 seconden zonder dat de gebruiker het merkt.
*   **Positief:** Ondersteunt zero-downtime updates, omdat er altijd replica's online blijven terwijl anderen worden bijgewerkt.
*   **Positief:** Door bewust 3 replica's op 5 nodes te draaien, behouden we 1 node als 'spare capacity'. Bij een hardwarecrash van een volledige server kan Docker Swarm direct uitwijken naar deze lege node.
*   **Negatief:** Iets hogere belasting op de MySQL database wegens de meerdere verbindingen en health checks.

---

## POC: Automatische health checking, rerouting en herstarten bij vastlopende instanties
## Wat bewijst mijn POC precies?

1. Er worden 3 replica's van de monoliet gestart op het 5-node cluster (waarbij automatisch 1 node vrij blijft als spare capacity).
2. Er wordt een crash gesimuleerd op 1 replica via een `POST /fail` request.
3. Dit toont aan dat het systeem bereikbaar blijft via de andere werkende replica's.
4. Ook herstart de Swarm de falende replica automatisch zodra de health check een fout detecteert.