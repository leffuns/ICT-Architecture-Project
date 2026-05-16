workspace {
    model {
        user = person "Sporter" "Zoekt en reserveert sportterreinen."
        clubAdmin = person "Club Beheerder" "Beheert terreinen en beschikbaarheid."
        
        keycloak = softwareSystem "Keycloak" "Identity & Access Management."
        stripe = softwareSystem "Payment Provider" "Verwerkt betalingen."

        softwareSystem = softwareSystem "Sportterrein Platform" {
            webapp = container "Web Applicatie" "React/Next.js" "Biedt de interface aan gebruikers en clubs."
            api = container "Modulaire Monoliet" "Python/Flask" "Bevat de business logica voor Catalog, Booking, Payment, Identity en Notifications."
            db = container "MySQL Database" "MySQL 8.0" "Slaat alle relationele data op (gebruikers, terreinen, boekingen)."
        }

        user -> webapp "Gebruikt"
        clubAdmin -> webapp "Beheert terreinen via"
        
        webapp -> api "Maakt API calls naar" "JSON/HTTPS"
        api -> db "Leest van en schrijft naar" "SQL/TCP"
        api -> keycloak "Valideert tokens bij" "OIDC"
        api -> stripe "Initieert betalingen via" "HTTPS/API"
    }

    views {
        container softwareSystem "Containers" "Het container diagram voor het Sportterrein Platform." {
            include *
            autoLayout
        }
    }
}
