### Karakteristieken

1. Securability
De applicatie gaat met persoonlijke gegevens van gebruikers en betalingsgegevens in contact komen. De gebruikers zullen zowel normale sporters zijn die terreinen huren, maar ook clubs en verenigingen die vaak enorm rijk zijn. Als er een leak gebeurt, gaat alle vertrouwen van die clubs weg en faalt de hele business. Dit is waarom beveiliging van gegevens en autorisatie de nummer 1 karakteristiek is van het project.

2. Reliability
Wanneer het gaat over het managen van tijdslots en tereinnen, is betrouwbaarheid belangrijk. Reservaties moeten verwerkt worden op een betrouwbare manier. Wanneer een tijdslot wordt betaald, dan moet die tijdslot inderdaad vrij zijn op het juiste terrein. 

3. Scalability
Reservaties voor terreinen kunnen piekmomenten hebben zoals tijdens weekends of vlak na normale werkuren of bij een nieuwe seizoen van een sport. De applicatie moet schaalbaar zijn en gereed zijn voor veel traffic tijdens bepaalde momenten. Meer en meer clubs en verenigingen kunnen ook klanten worden met hoe meer vertrouwen er in de applicatie is. 

4. Availability
Gebruikers moeten 24/7 kunnen boeken. Terreineneigenaars moeten ook 24/7 een rooster kunnen vinden van alle uitgehuurde tijdslots om verwarring te voorkomen. De applicatie moet streven naar altijd online te zijn met zo min mogelijke storingen voor updates of andere redenen.

5. Responsiveness
Wanneer een terrein wordt aangemaakt of gehuurd, moet het systeem alles kunnen processen op een snelle termijn. Anders kunnen klanten bij het huren tijdslots zien die eigenlijk niet open zijn. Dit kan planningen storen van die gebruikers.

6. Usability
Gebruikers willen liefst gemakkelijk te begrijpen interfaces. Het huren van terreinen en tijdslots kan al verwarrend zijn, dus het is best om het eenvoudig te houden voor alle leeftijden. Ook moeten clubs gemakkelijk kunnen zien wat uitgehuurd is en wanneer door eenvoudige interfaces.

7. Integrity
Boekingen van terreinen moeten alleen maar gedaan worden door 1 gebruiker. Dubbele boekingen leiden tot ongewilde chaos en verdriet. Huren van terreinen en in tijdslots moet integraal werken om te voorkomen dat er iets misloopt. De applicatie moet ervoor zorgen dat als iets gehuurd wordt, die niet opnieuw gehuurd worden ook al gebeuren de twee pogingen op een korte termijn.


### Logische Componenten

1. Identiteitsbeheer
Workflow: Gebruikers, zowel sporters als clubs, moeten in het begin een account aanmaken in het systeem zodat we hun identiteiten kunnen bijhouden voor toekomstige transacties.

Taken:
- Authenticatie (Veilig inloggen op de juiste account.)
- Autorisatie (Geschikte rechten hebben voor de accounts.)
- Beheren van persoonlijke gegevens.
- Bijhouden van gebruiksgeschiedenis op het platform.

2. Terreinbeheer
Workflow: Een club kan terreinen registreren om later te verhuren. De clubs moeten het ook beheren als ze iets willen aanpassen of veranderen.

Taken:
- Registreren en opslaan van adres.
- Bekendmaking van open tijdslots.
- Prijs aanpassen.
- Gegevens en beschikbaarheid van terreinen aanpassen.

3. Zoeken naar terreinen
Workflow: De gebruiker moet op de website een manier hebben om terreinen op te zoeken om die te kunnen huren.

Taken:
- Verwerken van zoekopdrachten.
- Filteren op gegevens, mogelijke zijn locatie, prijs, beschikbare tijdslots, etc.
- Genereren van een overzicht van geschikte terreinen.

4. Terreinen huren
Workflow: Eens dat een gebruiker een terrein heeft gevonden, moet die het terrein in het gekozen tijdslot kunnen huren als dat tijdslot open en vrij is.

Taken:
- Tijdslots kiezen.
- Detailinformatie over het terrein tonen.
- Tijdelijke reservatie plaatsen op een tijdslot.
- Koppelen van de juiste speler tot het juiste terrein.

5. Betalingsbeheer
Workflow: Eens dat een gebruiker een geschikt terrein heeft gevonden, moet die kunnen betalen om het definitief te huren.

Taken:
- Afhandelen van het betalingsproces.
- Berekenen van commissies en sturen naar de relevante club.
- Tijdelijke reservatie veranderen in een echte reservatie na succes van betaling.

6. Boekingoverzicht
Workflow: Als club moet er een overzicht zijn en verwittigingssysteem om te melden als een terrein werd gehuurd en wanneer.

Taken:
- Overzicht van terreinen tonen die behoren tot de clubs.
- Uitgehuurde tijdslots tonen.
- Notificatie als iemand van hen huurt.

### Verdere Beslissingen

#### Angeles ADR

# Kiezen voor een Relationele Database (MySQL)

## Status

Goedgekeurd.

## Context

Onze applicatie beheert sterke relaties tussen clubs, hun terreinen, de tijdslots van die terreinen en de gebruikers die aangesloten zijn op die tijdslots via hun eigen reservaties die dan ook gerelateerd zijn met de clubs. Daarnaast is er nood aan relaties tussen de financiële gegevens voor zowel de gebruikers als de clubs.

Hiervoor hebben we een database nodig met de nodige capaciteit om complexe relaties bij te houden en voor hoge data-integriteit. (Dit sluit aan met onze karakteristieken: Integrity en Reliability.)

We bespraken MongoDB omdat we ervaring ermee hebben en omdat boekingen constant veranderen, wat goed werkt met MongoDB (snel veranderende data), maar omdat het niet relationeel is kan het problematisch zijn. We werken met relaties die er als volgt uitzien:

- Elke boeking heeft een gebruiker.
- Elk gebruikt tijdslot heeft een boeking.
- Tijdslots behoren enkel tot hun terrein.
- Terreinen behoren alleen tot 1 club (We negeren voor nu terreinen die gedeeltelijk behoren tot meerdere clubs in een soort beaurocratisch systeem van shareholders.)
- Elke gebruiker en terrein hebben private betalingsgegevens.

## Decision

We kiezen voor MySQL als database. Het is relationeel, dus het zal goed met connecties omgaan, en we hebben al ervaring gehad met MySQL, dus we zullen snel ermee kunnen werken in plaats van de tijd nemen om een andere database te leren.

## Consequences

Wat wordt gemakkelijker of beter?
- Data-integriteit: Dankzij vaste relaties, kunnen tijdslots of boekingen niet ergens rondzweven in het systeem. Elke tijdslot of boeking moet een relatie hebben tot een gebruiker en terrein. Dit kan via `Foreign Keys`. In MongoDB zou data kunnen bestaan zonder relaties.
- Zoekopdrachten: MySQL is enorm geschikt om ermee te zoeken wegens de sterke relaties. Joins maken queries efficiënt en betrouwbaar.

Wat wordt moeilijker?
- Flexibiliteit: Als we fundamenteel iets willen veranderen aan de gegevens, zal dit intensieve datamigraties nodig hebben. Dit is trager dan bij relatie-loze (of schemaloze) databases.