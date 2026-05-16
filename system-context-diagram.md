workspace {
    model {
        sporter = person "Sporter" "Zoekt, vergelijkt en reserveert sportterreinen."
        clubAdmin = person "Club Beheerder" "Beheert terreinen en beschikbaarheid."

        keycloak = softwareSystem "Keycloak" "Identity & Access Management. Verifieert gebruikers en deelt JWT tokens uit."
        stripe = softwareSystem "Stripe" "Payment Provider. Verwerkt betalingen."

        sportPlatform = softwareSystem "Sportterrein Platform" "Centraal platform voor reservering van sportterreinen."

        sporter -> sportPlatform "Boekt terreinen"
        clubAdmin -> sportPlatform "Beheert terreinen"
        sportPlatform -> keycloak "Valideert tokens"
        sportPlatform -> stripe "Verwerkt betalingen"
        sportPlatform -> sporter "Bevestigingsmail"
        sportPlatform -> clubAdmin "Bevestigingsmail"
    }

    views {
        systemContext sportPlatform "SystemContext" "Systeemcontext diagram voor Sportterrein Platform" {
            include *
            autoLayout
        }
    }
}