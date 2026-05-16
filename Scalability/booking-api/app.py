import os
import socket
import time

from flask import Flask, jsonify, request
import mysql.connector

app = Flask(__name__)

DB_HOST = os.environ.get("DB_HOST", "db")
DB_USER = os.environ.get("DB_USER", "poc")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "poc")
DB_NAME = os.environ.get("DB_NAME", "bookings")

# Identificatie van deze specifieke container/replica
HOSTNAME = socket.gethostname()


def get_db_connection():
    """Maak een nieuwe database connectie aan."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )


def wait_for_db(max_retries=30, delay=2):
    """Wacht tot de database beschikbaar is bij het opstarten."""
    for attempt in range(max_retries):
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            cur.close()
            conn.close()
            print(f"[{HOSTNAME}] Database is beschikbaar na {attempt + 1} pogingen.")
            return True
        except mysql.connector.Error:
            print(f"[{HOSTNAME}] Wachten op database... poging {attempt + 1}/{max_retries}")
            time.sleep(delay)
    raise Exception("Kan geen verbinding maken met de database.")


# Wacht op DB bij het importeren (nodig voor Gunicorn)
wait_for_db()

# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint voor Docker Swarm.
    Controleert of de API draait EN of de database bereikbaar is.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({"status": "healthy", "hostname": HOSTNAME}), 200
    except Exception as e:
        print(f"[{HOSTNAME}] Health check failed: {str(e)}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 503


@app.route("/info", methods=["GET"])
def info():
    """
    Toont welke container/replica dit verzoek afhandelt.
    Dit bewijst dat de load balancer van Docker Swarm
    verkeer verdeelt over meerdere replicas.
    """
    return jsonify({
        "hostname": HOSTNAME,
        "message": f"Dit verzoek werd afgehandeld door replica {HOSTNAME}"
    })


@app.route("/courts", methods=["GET"])
def get_courts():
    """Geeft een lijst van alle beschikbare sportterreinen."""
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, name, sport FROM courts ORDER BY id")
    courts = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"courts": courts, "served_by": HOSTNAME})


@app.route("/slots", methods=["GET"])
def get_slots():
    """
    Geeft beschikbare (niet-geboekte) tijdslots terug.
    Optioneel filteren op court_id via query parameter.

    Voorbeeld: GET /slots?court_id=1
    """
    court_id = request.args.get("court_id", type=int)

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    if court_id:
        cur.execute("""
            SELECT ts.id, ts.court_id, c.name AS court_name, c.sport,
                   ts.start_time, ts.end_time, ts.is_booked
            FROM timeslots ts
            JOIN courts c ON ts.court_id = c.id
            WHERE ts.court_id = %s AND ts.is_booked = FALSE
            ORDER BY ts.start_time
        """, (court_id,))
    else:
        cur.execute("""
            SELECT ts.id, ts.court_id, c.name AS court_name, c.sport,
                   ts.start_time, ts.end_time, ts.is_booked
            FROM timeslots ts
            JOIN courts c ON ts.court_id = c.id
            WHERE ts.is_booked = FALSE
            ORDER BY ts.court_id, ts.start_time
        """)

    slots = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({
        "available_slots": slots,
        "count": len(slots),
        "served_by": HOSTNAME
    })


@app.route("/book", methods=["POST"])
def book_slot():
    """
    Boek een tijdslot.

    Verwacht JSON body:
        { "slot_id": 1, "user": "Viktor" }

    Gebruikt pessimistic locking (SELECT ... FOR UPDATE) om te garanderen
    dat bij gelijktijdige requests naar hetzelfde slot, slechts één
    boeking slaagt. Dit is cruciaal voor data-integriteit bij horizontale
    scaling met meerdere replicas.
    """
    data = request.get_json()

    if not data or "slot_id" not in data or "user" not in data:
        return jsonify({
            "error": "Vereiste velden: slot_id, user",
            "served_by": HOSTNAME
        }), 400

    slot_id = data["slot_id"]
    user = data["user"]

    conn = get_db_connection()
    try:
        # Begin een transactie
        conn.autocommit = False
        cur = conn.cursor(dictionary=True)

        # SELECT FOR UPDATE: vergrendelt de rij tot het einde van de transactie.
        # Andere transacties die hetzelfde slot willen boeken moeten wachten.
        cur.execute("""
            SELECT id, court_id, start_time, end_time, is_booked
            FROM timeslots
            WHERE id = %s
            FOR UPDATE
        """, (slot_id,))

        slot = cur.fetchone()

        if not slot:
            conn.rollback()
            return jsonify({
                "error": f"Tijdslot {slot_id} bestaat niet",
                "served_by": HOSTNAME
            }), 404

        if slot["is_booked"]:
            conn.rollback()
            return jsonify({
                "error": f"Tijdslot {slot_id} is al geboekt",
                "served_by": HOSTNAME
            }), 409  # Conflict

        # Boek het slot
        cur.execute("""
            UPDATE timeslots
            SET is_booked = TRUE, booked_by = %s
            WHERE id = %s
        """, (user, slot_id))

        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Tijdslot {slot_id} succesvol geboekt door {user}",
            "slot": {
                "id": slot["id"],
                "court_id": slot["court_id"],
                "start_time": str(slot["start_time"]),
                "end_time": str(slot["end_time"])
            },
            "served_by": HOSTNAME
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({
            "error": f"Interne fout: {str(e)}",
            "served_by": HOSTNAME
        }), 500
    finally:
        conn.close()


@app.route("/reset", methods=["POST"])
def reset_bookings():
    """
    Reset alle boekingen. Alleen bedoeld voor testing/demo doeleinden.
    Hiermee kan de load test herhaald worden zonder de stack te herstarten.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE timeslots SET is_booked = FALSE, booked_by = NULL")
    conn.commit()
    affected = cur.rowcount
    cur.close()
    conn.close()
    return jsonify({
        "message": f"{affected} tijdslots gereset",
        "served_by": HOSTNAME
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
