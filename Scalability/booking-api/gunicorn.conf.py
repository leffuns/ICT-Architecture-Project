# Gunicorn is een WSGI HTTP server die meerdere worker processen kan draaien
# binnen één container. In combinatie met Docker Swarm replicas geeft dit
# twee niveaus van parallellisme:
#   1. Meerdere containers (horizontale scaling via Swarm)
#   2. Meerdere workers per container (verticale scaling binnen de container)

bind = "0.0.0.0:5000"
workers = 4
timeout = 30
accesslog = "-"
errorlog = "-"
