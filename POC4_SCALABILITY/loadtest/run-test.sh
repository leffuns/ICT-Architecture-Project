#!/bin/sh
# Load Test Script voor Scalability POC
#
# Dit script voert drie tests uit:
#   1. Load balancing verificatie: toont dat requests verdeeld worden
#   2. Throughput test: meet requests/seconde op het /slots endpoint
#   3. Concurrency test: stuurt gelijktijdige boekingsverzoeken naar
#      hetzelfde slot om te bewijzen dat pessimistic locking werkt

API_URL="${API_URL:-http://booking-api:5000}"

echo "  SCALABILITY PROOF OF CONCEPT - LOAD TEST"


# 1 load Balancing Verificatie
echo "  TEST 1: Load Balancing Verificatie"
echo ""
echo "We sturen 20 requests naar /info en bekijken welke"
echo "container (hostname) elk verzoek afhandelt."
echo ""

for i in $(seq 1 20); do
    RESPONSE=$(curl -s "${API_URL}/info")
    HOSTNAME=$(echo "$RESPONSE" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
    echo "  Request ${i}: afgehandeld door ${HOSTNAME}"
done

echo ""
echo "→ Als je meerdere verschillende hostnames ziet, werkt load balancing."
echo ""

# 2: Throughput Test (GET /slots)
echo "  TEST 2: Throughput Test (GET /slots)"
echo ""
echo "We sturen 500 requests met 50 gelijktijdige connecties"
echo "naar GET /slots om de throughput te meten."
echo ""

# hey: HTTP load generator (https://github.com/rakyll/hey)
hey -n 500 -c 50 "${API_URL}/slots" 2>/dev/null

echo ""
echo "→ Herhaal deze test na het opschalen van replicas:"
echo "   docker service scale poc_booking-api=5"
echo "→ Vergelijk de 'Requests/sec' waarde."
echo ""


# 3:Concurrency / Data Integriteit Test
echo "  TEST 3: Concurrency / Data Integriteit"
echo ""
echo "We resetten alle boekingen en proberen dan 30 gelijktijdige"
echo "boekingsverzoeken naar HETZELFDE slot (id=1) te sturen."
echo "Slechts 1 mag slagen (HTTP 201), de rest moet falen (HTTP 409)."
echo ""

# Reset alle boekingen
curl -s -X POST "${API_URL}/reset" > /dev/null
echo "  ✓ Alle boekingen gereset"
echo ""

# Stuur 30 gelijktijdige POST requests naar hetzelfde slot
echo "  Stuur 30 gelijktijdige boekingen voor slot 1..."
echo ""

SUCCESS_COUNT=0
CONFLICT_COUNT=0
ERROR_COUNT=0

# Lanceer 30 parallelle curl requests
for i in $(seq 1 30); do
    curl -s -o "/tmp/result_${i}.txt" -w "%{http_code}" \
        -X POST "${API_URL}/book" \
        -H "Content-Type: application/json" \
        -d "{\"slot_id\": 1, \"user\": \"user_${i}\"}" \
        > "/tmp/status_${i}.txt" &
done

# Wacht tot alle requests voltooid zijn
wait

# Tel de resultaten
for i in $(seq 1 30); do
    STATUS=$(cat "/tmp/status_${i}.txt" 2>/dev/null)
    case "$STATUS" in
        201) SUCCESS_COUNT=$((SUCCESS_COUNT + 1)) ;;
        409) CONFLICT_COUNT=$((CONFLICT_COUNT + 1)) ;;
        *)   ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
    esac
done

echo "  Resultaten:"
echo "    Succesvol geboekt (201): ${SUCCESS_COUNT}"
echo "    Conflict/al geboekt (409): ${CONFLICT_COUNT}"
echo "    Fouten (andere):           ${ERROR_COUNT}"
echo ""

if [ "$SUCCESS_COUNT" -eq 1 ]; then
    echo "  GESLAAGD: Precies 1 boeking is gelukt."
    echo "     Data integriteit is gewaarborgd bij gelijktijdige toegang!"
elif [ "$SUCCESS_COUNT" -eq 0 ]; then
    echo "  Geen enkele boeking lukte. Controleer of de API draait."
else
    echo "  GEFAALD: ${SUCCESS_COUNT} boekingen zijn gelukt (verwacht: 1)."
    echo "     Er is een probleem met de concurrency controle!"
fi

echo ""

# Reset voor eventuele volgende tests
curl -s -X POST "${API_URL}/reset" > /dev/null

echo "TESTS VOLTOOID"

