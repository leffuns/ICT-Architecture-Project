## Deployment Diagram

Om de availability in de praktijk te garanderen, wordt de applicatie gedeployed op een Docker Swarm cluster bestaande uit **3 Manager Nodes** en **2 Worker Nodes**. 

*   **3 Replica's:** De modulaire monoliet draait in 3 instanties, verspreid over de verschillende nodes om een "Single Point of Failure" te voorkomen.
*   **3 Manager Nodes:** Waarvan 1 database node en 2 modulaire monolieten replicas. Zelfs als één manager uitvalt, blijft het cluster beslissingen nemen.
*   **2 Worker Nodes:** Waarvan 1 node de derde replica van de modulaire monoliet draait en 1 node dient als spare capacity voor automatische failover bij serveruitval.
*   **MySQL:** De database draait op een Manager node (Node 1) voor maximale stabiliteit.

```structurizr
workspace {
    model {
        user = person "Sporter" "Wil een terrein boeken"
        softwareSystem = softwareSystem "Sportterrein Platform" {
            api = container "Modulaire Monoliet" "App logica" "Python/Flask"
            db = container "MySQL Database" "Opslag" "MySQL"
        }

        user -> api "Maakt boekingen"
        api -> db "Slaat data op"

        deploymentEnvironment "Production" {
            deploymentNode "Docker Swarm Cluster" {
                
                deploymentNode "Manager Node 1" {
                    containerInstance db
                }
                deploymentNode "Manager Node 2" {
                    containerInstance api
                }
                deploymentNode "Manager Node 3" {
                    containerInstance api
                }
                
                deploymentNode "Worker Node 1" {
                    containerInstance api
                }
                
                # Hier maken we de 2de worker 'zichtbaar' met een placeholder
                deploymentNode "Worker Node 2" "Lege node voor schaalbaarheid" {
                    infrastructureNode "Spare Capacity" "Beschikbaar voor failover"
                }
            }
        }
    }

    views {
        deployment softwareSystem "Production" "VisibleDeployment" {
            include *
            autoLayout lr
        }
    }
}
```
