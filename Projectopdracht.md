# Projectopdracht ICT Architecture
Groepsleden (2ITAI1):
- Louis Boulez (*studentennummer*)
- Jonas Lemmens (*studentennummer*)
- Angeles Osier (*studentennummer*)
- Hajar Takhrifa (163393)
- Viktor Van Deun (*studentennummer*)

## Opgave
"Veronderstel in de eerste plaats dat de afgestudeerde versie van je team deze opdracht productieklaar moet maken op een half jaar tijd. In je ADR's kan je vermelden welke beslissingen anders zouden zijn als je team en je budget groter / kleiner waren. Voor de vraag "wat de klant waarschijnlijk belangrijk vindt" kijk je naar de gegeven voorbeelden.<br>
**Je klant wil een platform bouwen voor het reserveren van sportterreinen (tennis, padel, voetbal). Gebruikers moeten beschikbare tijdslots kunnen bekijken en betalen. Clubs moeten hun eigen beschikbaarheid kunnen beheren. Vergelijkbare voorbeelden zijn Playtomic.**"

## Karakteristieken
De 7 belangrijkste karakteristieken van de applicatie worden in de tabel hieronder beschreven. Hierna volgt een korte beschrijving per karakteristiek.
|Nr.|Karakteristiek|Expliciet?|Top3|
|:---:|:---------------:|:----------:|:-----:|
|1|Securability|Nee|Ja|
|2|Availability|Ja|Ja|
|3|Integrity|Nee|Ja|
|4|Reliability|Nee|Nee|
|5|Responsiveness|Ja|Nee|
|6|Usability|Ja|Nee|
|7|Scalability|Nee|Nee|

**Securability**<br>
De applicatie gaat met persoonlijke gegevens van gebruikers en betalingsgegevens in contact komen. De gebruikers zullen zowel normale sporters zijn die terreinen huren, maar ook clubs en verenigingen die vaak enorm rijk zijn. Als er een leak gebeurt, gaat alle vertrouwen van die clubs weg en faalt de hele business. Dit is waarom beveiliging van gegevens en autorisatie de nummer 1 karakteristiek is van het project.

**Availability**<br>
Gebruikers moeten 24/7 kunnen boeken. Terreineneigenaars moeten ook 24/7 een rooster kunnen vinden van alle uitgehuurde tijdslots om verwarring te voorkomen. De applicatie moet streven naar altijd online te zijn met zo min mogelijke storingen voor updates of andere redenen.

**Integrity**<br>
Boekingen van terreinen moeten alleen maar gedaan worden door 1 gebruiker. Dubbele boekingen leiden tot ongewilde chaos en verdriet. Huren van terreinen en in tijdslots moet integraal werken om te voorkomen dat er iets misloopt. De applicatie moet ervoor zorgen dat als iets gehuurd wordt, die niet opnieuw gehuurd worden ook al gebeuren de twee pogingen op een korte termijn.

**Reliability**<br>
Wanneer het gaat over het managen van tijdslots en tereinnen, is betrouwbaarheid belangrijk. Reservaties moeten verwerkt worden op een betrouwbare manier. Wanneer een tijdslot wordt betaald, dan moet die tijdslot inderdaad vrij zijn op het juiste terrein. 

**Responsiveness**<br>
Wanneer een terrein wordt aangemaakt of gehuurd, moet het systeem alles kunnen processen op een snelle termijn. Anders kunnen klanten bij het huren tijdslots zien die eigenlijk niet open zijn. Dit kan planningen storen van die gebruikers.

**Usability**<br>
Gebruikers willen liefst gemakkelijk te begrijpen interfaces. Het huren van terreinen en tijdslots kan al verwarrend zijn, dus het is best om het eenvoudig te houden voor alle leeftijden. Ook moeten clubs gemakkelijk kunnen zien wat uitgehuurd is en wanneer door eenvoudige interfaces.

**Scalability**<br>
Reservaties voor terreinen kunnen piekmomenten hebben zoals tijdens weekends of vlak na normale werkuren of bij een nieuwe seizoen van een sport. De applicatie moet schaalbaar zijn en gereed zijn voor veel traffic tijdens bepaalde momenten. Meer en meer clubs en verenigingen kunnen ook klanten worden met hoe meer vertrouwen er in de applicatie is. 

## Logische Componenten
### Actor/action
**Gebruiker**
- Inloggen
- Beschikbare terreinen zoeken/kiezen
- Beschikbare tijdslot kiezen
- Reservatie bevestigen
- Boeking betalen
- Reservatie annuleren
- Reservaties bekijken
- Eigen account beheren

**Club(beheerder)**
- Inloggen
- Clubgegevens beheren
- Terreingegevens beheren
- Reservaties bekijken
- Terrein toevoegen/verwijderen
- Open tijdsloten aanpaassen

**Systeem**
- Stuur notificaties/bevestigingsmails
- Verwerk betaling
- Update beschikbare tijdslot na een reservatie/annulering

### Workflow
**Workflow 1:**<br>
De gebruiker boekt een veld:
```
Inloggen → Terrein zoeken en kiezen → Tijdslot kiezen → Betalen
```
**Workflow 2:**<br>
De club(beheerder) stelt zijn club in:
```
Inloggen → Terrein toevoegen → Informatie invullen → Open tijdslots toevoegen → Boekingen bekijken
```

### De logische componenten
Uit de vorige analyses stellen we de volgende logische componenten vast:
1. <u>Gebruikersbeheer</u><br>
Taken:
- Authenticatie (Veilig inloggen op de juiste account.)
- Autorisatie (Geschikte rechten hebben voor de accounts.)
- Beheren van persoonlijke gegevens.
- Bijhouden van gebruiksgeschiedenis op het platform.

2. <u>Terreinmanagement</u><br>
Taken:
- Registreren en opslaan van adres.
- Bekendmaking van open tijdslots.
- Prijs aanpassen.
- Gegevens en beschikbaarheid van terreinen aanpassen.

3. <u>Betalingsverwerking</u><br>
Taken:
- Afhandelen van het betalingsproces.
- Berekenen van commissies en sturen naar de relevante club.
- Tijdelijke reservatie veranderen in een echte reservatie na succes van betaling.
- Annulaties en refunds verwerken.

4. <u>Boekingsbeheer/Reserveringsafhandeling</u><br>
Taken:
- Plaatsen van een tijdelijke reservatie (hold) op een slot.
- Veranderen van een hold naar een bevestigde reservatie na geldige betaling.
- Vrijgeven van verlopen of geannuleerde reservaties.
- Boekingsgeschiedenis aan de gebruiker tonen.
- Bezette slots aan clubbeheerders tonen.

5. <u>Notificatiesysteem</u><br>
- Bevestigingsmails sturen.
- Clubbeheerders notificeren bij boekingen/annulaties.

## Architecturale stijl
### ADR 1: Keuze van architecturale stijl
#### Status
Geaccepteerd

#### Context
We bouwen een nieuw reserveringsplatform voor tennis-, padel- en voetbalterreinen. Het systeem wordt gebruikt door zowel sporters (die zoeken, reserveren en betalen) als clubbeheerders (die hun terreinen ter beschikking stellen en beschikbaarheden beheren). Het systeem is vergelijkbaar met het reeds bestaande platform Playtomic.

We zijn een team van 5 pas afgestudeerden en de applicatie moet binnen 6 maanden productieklaar zijn. De driving characteristics zijn; integrity, availability, reliability, securability, responsiveness, scalability en usability.

Alle vijf stijlen, die we in de cursus behandelden, werden tegen elkaar afgewogen: gelaagde architectuur, modulaire monoliet, microkernel, microservices en event-driven.

#### Decision
We kiezen voor een **modulaire monoliet** met vijf subdomeinen: 
- Catalog (sporten, terreinen, clubs)
- Booking (slots en reservaties)
- Payment (transacties en refunds)
- Identity (users, clubs, rollen)
- Notifications (mail, push)

Code wordt eerst per subdomein georganiseerd. Elke module bezit haar eigen DB-schema in één gedeelde instantie. Verwijzingen tussen modules verlopen via expliciete ID-referenties en interface-aanroepen, niet via cross-schema foreign keys. De applicatie wordt als één unit gedeployed.

Verantwoording:
We kozen niet voor microservices omdat dat complexer is voor een klein team van junios met weinig tijd. Experts zoals Sam Newman en Martin Fowlen zeggen ook dat microservices pas zinvol zijn bij grotere teams en systemen. Een modulaire monoliet is eenvoudiger te bouwen en kan later, als het platform groeit, stap voor stap omgezet worden naar microservices. 

#### Consequences
Voordelen: 
- Eenvoudige deployment.
- Makkelijker te testen.
- Reserveren en betalen kunnen samen afgehandeld worden.

Nadelen:
- Als één onderdeel crasht, kan de hele app uitvallen.
- Je kan niet 1 stuk apart opschalen.

#### Alternatives
Bij een groter en/of een ervaringrijker team zouden we de microservices verkiezen. 
(nog online zoeken naar extra stijlen)

## Verdere beslissingen
### ADR 2 : Authenticatie en autorisatie via OpenID Connect met Keycloak
#### Status
Accepted

#### Context
We bouwen een modulaire monoliet voor het reserveren van sporttijdslots, waarbij we 'Securability' als belangrijkste karakteristiek ervaren. Het platform heeft drie soorten gebruikers met verschillende rechten:

- Eindgebruikers: boeken slots, betalen, beheren hun eigen profiel
- Clubbeheerders: beheren beschikbaarheid, prijzen en terreinen van hun eigen club
- Platformbeheerders: interne staff voor support en refunds

De klant kan verwachten dat eindgebruikers kunnen inloggen via sociale accounts (Google, Apple), omdat dat in B2C-bookingplatformen een gebruikelijke UX-verwachting is. Later moet er ook een SSO-koppeling mogelijk zijn met sportbonden.

We hebben drie opties overwogen:

1. Eigen authenticatiesysteem  bouwen:
- passwords zelf hashen (bcrypt/argon2)
- sessies beheren
- password-resetflows
- OAuth2-server zelf draaien voor third-party integraties.
2. Managed Identity Provider:  Auth0 of AWS Cognito.
3. Een zelf-gehoste open-source oplossing: Keycloak (de facto standaard), ORY Hydra, Authelia.

#### Decision

We kiezen voor OpenID Connect (OIDC) als protocol en **self-hosted Keycloak** als Identity Provider. Onze applicatie beheert zelf geen wachtwoorden (dat doet Keycloak volledig). Eén Keycloak-realm sportbooking bevat drie realm-rollen (end_user, club_admin, platform_admin) en wordt door alle clients (web, mobiel, eventuele toekomstige API-partners) gedeeld.

Authenticatieflows:
- Web en mobiel: Authorization Code Flow met PKCE.
- Sociale login: via Keycloak Identity Brokering, niet rechtstreeks in onze applicatie.

Onze backend controleert bij elk verzoek het JWT-token via Keycloak. Rolcontroles zitten op één centrale plek, niet verspreid door de code.

#### Consequences

Wat mogelijk wordt:
- Sociale logins (Google, Apple) configureren via Keycloak's UI in plaats van per provider eigen code.
- MFA inschakelen per rol met één klik (verplicht voor platform_admin, optioneel voor de rest).
- Ingebouwde wachtwoordbeleid en accountblokkering
- Onze backend bewaart geen passwords, dus een DB-leak compromitteert geen credentials.

Risico's:
- Als Keycloak uitvalt, kan niemand nieuw inloggen (bestaande logins blijven werken tot het token vervalt). We kunnen minimum twee Keycloak-instanties draaien om dit op te vangen.
- Extra beheer: Keycloak heeft een eigen database, updates en monitoring nodig.
- Migreren naar een andere identity provider later vereist dat alle gebruikers hun wachtwoord opnieuw instellen.

### ADR 2 :
### ADR 3 :
### ADR 4 : 
### ADR 5 :

## C4-model
### Systeemcontextdiagram
### Containerdiagram
### Deploymentdiagram

## Proofs of Concept

## Bronnen
https://en.wikipedia.org/wiki/List_of_system_quality_attributes
https://www.infoq.com/podcasts/microservices-benefits-supersede-caveats/
https://martinfowler.com/bliki/MonolithFirst.html
https://datatracker.ietf.org/doc/html/rfc6749
https://www.keycloak.org/documentation
