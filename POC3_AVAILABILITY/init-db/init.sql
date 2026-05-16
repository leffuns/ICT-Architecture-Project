-- Initialisatie voor MySQL
CREATE TABLE IF NOT EXISTS bookings (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    court_name  VARCHAR(100) NOT NULL,
    time_slot   VARCHAR(50)  NOT NULL,
    booked_by   VARCHAR(100) NOT NULL DEFAULT 'anoniem',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bookings (court_name, time_slot, booked_by) VALUES
    ('Padel 1',   '18:00-19:00', 'Jonas'),
    ('Tennis A',  '10:00-11:00', 'Hajar'),
    ('Voetbal 3', '20:00-21:30', 'Viktor');
