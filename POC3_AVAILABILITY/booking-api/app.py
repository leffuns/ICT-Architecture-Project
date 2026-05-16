"""
POC Availability — Booking API (MySQL Version)
Demonstreert hoe health checks + replica's + Docker Swarm failover
ervoor zorgen dat het reserveringsplatform beschikbaar blijft.
"""

import os
import socket
import logging
import time

from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import pooling

# Configuratie
DB_HOST = os.environ.get("DB_HOST", "db")
DB_USER = os.environ.get("DB_USER", "poc")
DB_PASS = os.environ.get("DB_PASSWORD", "poc")
DB_NAME = os.environ.get("DB_NAME", "bookings")

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("booking-api")

# State: de "kill switch" voor de health check demo
_healthy = True
_request_count = 0

# Database helpers
_pool = None

def get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name="mypool",
                pool_size=5,
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                database=DB_NAME
            )
        except Exception as e:
            logger.error("Kon connection pool niet maken: %s", e)
    return _pool

def db_is_reachable() -> bool:
    try:
        pool = get_pool()
        if not pool: return False
        conn = pool.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        logger.warning("DB niet bereikbaar: %s", e)
        return False

# Endpoints
@app.route("/health", methods=["GET"])
def health():
    if not _healthy:
        return jsonify({"status": "unhealthy", "reason": "manual fail", "hostname": socket.gethostname()}), 503
    if not db_is_reachable():
        return jsonify({"status": "unhealthy", "reason": "db unreachable", "hostname": socket.gethostname()}), 503
    return jsonify({"status": "healthy", "hostname": socket.gethostname()}), 200

@app.route("/hostname", methods=["GET"])
def hostname():
    global _request_count
    _request_count += 1
    return jsonify({"hostname": socket.gethostname(), "count": _request_count})

@app.route("/bookings", methods=["GET"])
def list_bookings():
    try:
        pool = get_pool()
        conn = pool.get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM bookings ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify({"hostname": socket.gethostname(), "bookings": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/book", methods=["POST"])
def create_booking():
    data = request.get_json(force=True)
    court = data.get("court", "Padel 1")
    slot = data.get("time_slot", "18:00-19:00")
    user = data.get("user", "Jonas")

    try:
        pool = get_pool()
        conn = pool.get_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO bookings (court_name, time_slot, booked_by) VALUES (%s, %s, %s)",
            (court, slot, user)
        )
        conn.commit()
        booking_id = cur.lastrowid
        cur.close()
        conn.close()
        return jsonify({"message": "OK", "id": booking_id, "hostname": socket.gethostname()}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/fail", methods=["POST"])
def simulate_failure():
    global _healthy
    _healthy = False
    return jsonify({"message": "Service is now unhealthy", "hostname": socket.gethostname()})

@app.route("/", methods=["GET"])
def index():
    return jsonify({"service": "Booking API (MySQL)", "hostname": socket.gethostname(), "healthy": _healthy})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
