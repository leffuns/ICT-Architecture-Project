"""
Mini-backend die Keycloak-tokens controleert.

Ik heb drie endpoints voorzien:
  /open          -> iedereen
  /mijn-profiel  -> enkel met geldig token (= ingelogd)
  /club-beheer   -> enkel met de rol 'club_admin'
"""

from fastapi import FastAPI, Request, HTTPException
import jwt
from jwt import PyJWKClient

app = FastAPI()

# Waar Keycloak draait
KEYCLOAK = "http://keycloak:8080"
REALM = "sportbooking"

# Keycloak ondertekent tokens met een geheime sleutel. Via dit endpoint kunnen we de bijbehorende publieke sleutel ophalen om de handtekening te controleren.
jwks = PyJWKClient(f"{KEYCLOAK}/realms/{REALM}/protocol/openid-connect/certs")


def lees_token(request: Request) -> dict:
    """Haalt het token uit de request en controleert of het geldig is."""
    header = request.headers.get("authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(401, "Geen token meegestuurd")

    token = header.removeprefix("Bearer ")
    try:
        sleutel = jwks.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            sleutel,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token is ongeldig")


@app.get("/open")
def open_endpoint():
    return {"bericht": "Dit mag iedereen zien."}


@app.get("/mijn-profiel")
def mijn_profiel(request: Request):
    gegevens = lees_token(request)
    return {"bericht": f"Hallo {gegevens['preferred_username']}, je bent ingelogd."}


@app.get("/club-beheer")
def club_beheer(request: Request):
    gegevens = lees_token(request)
    rollen = gegevens.get("realm_access", {}).get("roles", [])
    if "club_admin" not in rollen:
        raise HTTPException(403, "Je hebt de rol 'club_admin' nodig.")
    return {"bericht": f"Welkom in het clubbeheer, {gegevens['preferred_username']}."}