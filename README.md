## Project

### todo
- 7 karakteriestieken
- 5 proof of concept
- Leg uit karakteristieken en logische componenten
- Hoofd ADR document (1 werkt hier aan)
- 5 extra ADR (ieder werkt 1 uit)
- systeemcontextdiagram, een containerdiagram en een deployment diagram (3 werken hier aan 1 elk)

## Opdracht

Je klant wil een platform bouwen voor het reserveren van sportterreinen (tennis, padel, voetbal). Gebruikers moeten beschikbare tijdslots kunnen bekijken en betalen. Clubs moeten hun eigen beschikbaarheid kunnen beheren. Vergelijkbare voorbeelden zijn Playtomic.

### 7 Gekozen karakteristieken

1. Securability

2. Reliability

3. Scalability - Viktor

4. Availability - Jonas

5. Responsiveness - Hajar

6. Usability - Louis

7. Integrity - Angeles





# Structurizr (voeg dit toe aan hoofdocument later)

workspace "Sportterrein Platform" "Architectuur van het Playtomic-achtig platform" {

    model {
        # Actoren
        sporter = person "Sporter" "Zoekt en reserveert sportterreinen."
        clubAdmin = person "Clubbeheerder" "Beheert beschikbaarheid van terreinen."

        # Externe systemen
        paymentProvider = softwareSystem "Betalingsprovider" "Verwerkt online betalingen (bijv. Stripe)." "External"
        mailService = softwareSystem "E-mail Service" "Verstuurt reserveringsbevestigingen." "External"

        # Jouw Systeem
        bookingSystem = softwareSystem "Sport Platform" "Centraal platform voor reserveringen." {
            webApp = container "Web Applicatie" "Biedt de interface voor sporters en clubs." "React / Next.js"
            api = container "Booking API" "Handelt de business logica af." "Python / Flask"
            db = container "Database" "Slaat gebruikers, clubs en boekingen op." "PostgreSQL" "Database"
            cache = container "Cache" "Verhoogt de responsiveness voor zoekopdrachten." "Redis"
        }

        # Interacties
        sporter -> webApp "Zoekt en boekt terreinen"
        clubAdmin -> webApp "Beheert terreinen en prijzen"
        webApp -> api "Roept functies aan via" "JSON/HTTPS"
        api -> db "Leest/Schrijft naar" "SQL/TCP"
        api -> cache "Slaat tijdelijke data op in"
        api -> paymentProvider "Verifieert betalingen via"
        api -> mailService "Verstuurt bevestigingen via"
        
        # Deployment (3 managers, 2 workers)
        deploymentEnvironment "Production" {
            deploymentNode "Docker Swarm Cluster" {
                deploymentNode "Manager Nodes (3)" {
                    containerInstance db
                    containerInstance cache
                }
                deploymentNode "Worker Nodes (2)" {
                    containerInstance webApp
                    containerInstance api
                }
            }
        }
    }

    views {
        systemContext bookingSystem "SystemContext" {
            include *
            autoLayout
        }

        container bookingSystem "Containers" {
            include *
            autoLayout
        }

        deployment bookingSystem "Production" "Deployment" {
            include *
            autoLayout
        }

        styles {
            element "External" {
                background #999999
                color #ffffff
            }
            element "Container" {
                background #1168bd
                color #ffffff
            }
            element "Database" {
                shape Cylinder
            }
        }
    }
}
