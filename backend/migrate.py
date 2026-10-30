import os
import sys

try:
    from database import get_connection, DB_PATH
except ImportError:
    from backend.database import get_connection, DB_PATH

def run_migrations():
    schema_path = os.path.join(os.path.dirname(__file__), "migrations", "schema.sql")
    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found at: {schema_path}")

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()
    print(f"Migration completed successfully. Database: {DB_PATH}")

if __name__ == "__main__":
    run_migrations()
    try:
        from seed import seed_admin
    except ImportError:
        from backend.seed import seed_admin
    force_seed = "--force-seed" in sys.argv
    seed_admin(force=force_seed)
