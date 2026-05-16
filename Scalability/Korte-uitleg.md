# Doel
Het doel was om te bewijzen dat onze Modulaire Monoliet piekuren (zoals vrijdagavond om 18:00) aankan door simpelweg extra server-instanties toe te voegen, zonder dat er fouten in de boekingen ontstaan.

De 3 belangrijkste onderdelen:
## Horizontale Schaalbaarheid (De 'Snelheid'):

Uitleg: We draaien onze monoliet niet als één blok, maar als meerdere kopieën (replicas) in een Docker Swarm.
Resultaat: Als het druk wordt, typen we docker service scale = 10 en we hebben direct 10x zoveel rekenkracht. De load balancer van Docker verdeelt het verkeer automatisch over die 10 kopieën.

## Stateless Design (De 'Flexibiliteit'):

Uitleg: De monoliet-containers onthouden zelf niets (geen lokale sessies).
Resultaat: Het maakt voor een gebruiker niet uit in welke container hij terechtkomt; elke replica kan elk verzoek afhandelen. Dit maakt het opschalen super makkelijk.

## Pessimistic Locking (De 'Veiligheid'):

Uitleg: Dit is het meest kritieke deel. Omdat er 10 instanties tegelijkertijd naar de database kijken, zouden twee mensen per ongeluk hetzelfde padelterrein op hetzelfde moment kunnen boeken.
Oplossing: We gebruiken SELECT FOR UPDATE in MySQL. Zodra één replica een tijdslot bekijkt om te boeken, "bevriest" de database dat slot voor alle andere replica's totdat de boeking klaar is. Onze test bewees dat van de 30 mensen die tegelijk klikten, er altijd exact 1 een boeking kreeg en de rest een foutmelding.
Wat de POC bewijst:
"Onze tests laten zien dat we de verwerkingssnelheid (requests per seconde) verhogen door de monoliet op te schalen, terwijl we 100% garantie hebben dat dubbele boekingen onmogelijk zijn. We zijn dus klaar voor groei!"