"""
Proof of Concept: Integrity (Double Booking test)
"""

import threading
import time

db_lock = threading.Lock()

GEBOEKT = False
TERREIN_SLOT = "Veld 1 - 18:00"


def probeer_te_boeken(naam):
    """
    Simuleert een poging om een terrein te boeken. Er is maar 1 slot beschikbaar,
    dus als 2 mensen tegelijk proberen te boeken, zal er 1 mislukken.
    """

    # Pylint is hier te streng dus voor deze ene keer schakel ik het uit.
    # pylint: disable=global-statement
    global GEBOEKT

    print(f"[{naam}] Probeert {TERREIN_SLOT} te boeken...")

    with db_lock:
        print(f"[{naam}] Heeft de lock, checkt nu de database...")

        time.sleep(1.5)

        if GEBOEKT is False:
            print(f"[{naam}] Slot is nog vrij! Bezig met opslaan...")
            GEBOEKT = True
            print(f"[{naam}] -> SUCCES: Boeking is bevestigd.\n")
        else:
            print(f"[{naam}] -> ERROR: Te laat, slot is al bezet.\n")


# ------------------------ Main script ------------------------
print("--- Start POC Integrity (Double Booking test) ---")
print("Bob en Alice proberen exact tegelijk in te sturen\n")

t1 = threading.Thread(target=probeer_te_boeken, args=("Alice",))
t2 = threading.Thread(target=probeer_te_boeken, args=("Bob",))

t1.start()
t2.start()

t1.join()
t2.join()

print("--- POC Klaar ---")
