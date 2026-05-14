-- =============================================================================
-- Database schema voor het sportterrein-reserveringsplatform (POC)
-- =============================================================================

-- Tabel: courts (sportterreinen)
CREATE TABLE IF NOT EXISTS courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL
);

-- Tabel: timeslots (beschikbare tijdvakken per terrein)
CREATE TABLE IF NOT EXISTS timeslots (
    id SERIAL PRIMARY KEY,
    court_id INT NOT NULL REFERENCES courts(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by VARCHAR(100) DEFAULT NULL
);

-- Index op veelgebruikte query: beschikbare slots per terrein
CREATE INDEX IF NOT EXISTS idx_timeslots_available
    ON timeslots (court_id, is_booked, start_time);

-- =============================================================================
-- Seed data: 3 terreinen met elk 10 tijdslots
-- =============================================================================

INSERT INTO courts (name, sport) VALUES
    ('Terrein A', 'tennis'),
    ('Terrein B', 'padel'),
    ('Terrein C', 'voetbal');

-- Terrein A (tennis) - 10 slots van 1 uur
INSERT INTO timeslots (court_id, start_time, end_time) VALUES
    (1, '2026-06-01 08:00', '2026-06-01 09:00'),
    (1, '2026-06-01 09:00', '2026-06-01 10:00'),
    (1, '2026-06-01 10:00', '2026-06-01 11:00'),
    (1, '2026-06-01 11:00', '2026-06-01 12:00'),
    (1, '2026-06-01 12:00', '2026-06-01 13:00'),
    (1, '2026-06-01 13:00', '2026-06-01 14:00'),
    (1, '2026-06-01 14:00', '2026-06-01 15:00'),
    (1, '2026-06-01 15:00', '2026-06-01 16:00'),
    (1, '2026-06-01 16:00', '2026-06-01 17:00'),
    (1, '2026-06-01 17:00', '2026-06-01 18:00');

-- Terrein B (padel) - 10 slots van 1.5 uur
INSERT INTO timeslots (court_id, start_time, end_time) VALUES
    (2, '2026-06-01 08:00', '2026-06-01 09:30'),
    (2, '2026-06-01 09:30', '2026-06-01 11:00'),
    (2, '2026-06-01 11:00', '2026-06-01 12:30'),
    (2, '2026-06-01 12:30', '2026-06-01 14:00'),
    (2, '2026-06-01 14:00', '2026-06-01 15:30'),
    (2, '2026-06-01 15:30', '2026-06-01 17:00'),
    (2, '2026-06-01 17:00', '2026-06-01 18:30'),
    (2, '2026-06-01 18:30', '2026-06-01 20:00'),
    (2, '2026-06-01 20:00', '2026-06-01 21:30'),
    (2, '2026-06-01 21:30', '2026-06-01 23:00');

-- Terrein C (voetbal) - 10 slots van 2 uur
INSERT INTO timeslots (court_id, start_time, end_time) VALUES
    (3, '2026-06-01 08:00', '2026-06-01 10:00'),
    (3, '2026-06-01 10:00', '2026-06-01 12:00'),
    (3, '2026-06-01 12:00', '2026-06-01 14:00'),
    (3, '2026-06-01 14:00', '2026-06-01 16:00'),
    (3, '2026-06-01 16:00', '2026-06-01 18:00'),
    (3, '2026-06-01 18:00', '2026-06-01 20:00'),
    (3, '2026-06-01 20:00', '2026-06-01 22:00'),
    (3, '2026-06-02 08:00', '2026-06-02 10:00'),
    (3, '2026-06-02 10:00', '2026-06-02 12:00'),
    (3, '2026-06-02 12:00', '2026-06-02 14:00');
