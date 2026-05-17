workspace {
    model {
        sporter = person "Sporter" "Zoekt, vergelijkt en reserveert sportterreinen."
        clubAdmin = person "Club Beheerder" "Beheert terreinen en beschikbaarheid."

        keycloak = softwareSystem "Keycloak" "Identity & Access Management. Verifieert gebruikers en deelt JWT tokens uit."

        sportPlatform = softwareSystem "Sportterrein Platform" "Centraal platform voor reservering van sportterreinen."

        sporter -> sportPlatform "Boekt terreinen"
        clubAdmin -> sportPlatform "Beheert terreinen"
        sporter -> sportPlatform "betalingen overmaken"
        sportPlatform -> keycloak "Valideert tokens"
        sportPlatform -> sporter "Bevestigingsmail"
        sportPlatform -> clubAdmin "Bevestigingsmail"
        keycloak -> sportPlatform "JTW tokens"
    }

    views {
        systemContext sportPlatform "SystemContext" "Systeemcontext diagram voor Sportterrein Platform" {
            include *
            autoLayout
        }
    }
}