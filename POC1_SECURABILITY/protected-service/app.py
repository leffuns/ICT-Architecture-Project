"""
Mini-monoliet die JWT's van Keycloak valideert en role-based access toepast.
Demonstreert:
- JWT's worden lokaal gevalideerd via Keycloak's JWKS-endpoint
- Role-checks zitten in één centrale guard, niet verspreid over endpoints
- Business modules zien alleen 'user heeft rol X', niet de JWT zelf
"""

from fastapi import FastAPI, Request, HTTPException, Depends
import jwt
from jwt import PyJWKClient

# Interne service-naam (overlay network) voor JWKS-fetching
KC_INTERNAL_URL = "http://keycloak:8080"
# Wat de issuer-claim in tokens zal zijn (zoals de browser/curl Keycloak ziet)
ISSUER = "http://localhost:8080/realms/sportbooking"
JWKS_URL = f"{KC_INTERNAL_URL}/realms/sportbooking/protocol/openid-connect/certs"

app = FastAPI(title="Sportbooking Protected Service (POC)")

# PyJWKClient cachet de keys; periodieke refresh is automatisch
jwks_client = PyJWKClient(JWKS_URL, cache_keys=True)

def get_claims(request: Request) -> dict:
    """
    Centrale guard. Haalt en valideert het bearer token.
    Geen enkele business-functie parseert JWT's zelf.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    token = auth.split(" ", 1)[1]
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=ISSUER,
            options={"verify_aud": False},  # in productie zetten we een audience
        )
        return payload
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

def require_role(role: str):
    """Factory voor role-guards. Gebruik: Depends(require_role('club_admin'))."""
    def dependency(claims: dict = Depends(get_claims)) -> dict:
        roles = claims.get("realm_access", {}).get("roles", [])
        if role not in roles:
            raise HTTPException(status_code=403, detail=f"Missing required role: {role}")
        return claims
    return dependency


# Endpoints

@app.get("/public")
def public():
    """Geen auth vereist."""
    return {"message": "Hello from the sportbooking platform"}

@app.get("/me")
def whoami(claims: dict = Depends(get_claims)):
    """Elke geauthenticeerde user."""
    return {
        "username": claims.get("preferred_username"),
        "roles": claims.get("realm_access", {}).get("roles", []),
    }

@app.get("/club-admin/dashboard")
def club_dashboard(claims: dict = Depends(require_role("club_admin"))):
    """Alleen voor clubbeheerders."""
    return {
        "message": f"Welcome to the club dashboard, {claims['preferred_username']}",
        "courts_managed": 4,
        "todays_bookings": 17,
    }

@app.get("/admin/users")
def admin_users(claims: dict = Depends(require_role("platform_admin"))):
    """Alleen voor platformbeheerders."""
    return {
        "message": f"Admin panel — accessed by {claims['preferred_username']}",
        "total_users": 12483,
        "pending_refunds": 3,
    }