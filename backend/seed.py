from datetime import datetime, timezone
import bcrypt

try:
    from database import get_connection, DB_PATH
except ImportError:
    from backend.database import get_connection, DB_PATH

def seed_admin(force: bool = False) -> bool:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        try:
            from migrate import run_migrations
        except ImportError:
            from backend.migrate import run_migrations
        run_migrations()

    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count > 0 and not force:
        print(f"Database already contains {user_count} user(s). Skipping seed.")
        conn.close()
        return False

    username = "admin"
    password = "admin123"
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO users (username, password_hash, full_name, role, user_type, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (username, password_hash, "Admin User", "admin", "admin", "executive", now_iso))

    conn.commit()
    conn.close()
    print(f"Seeded admin user (username: admin, password: {password}) into {DB_PATH}")
    return True

if __name__ == "__main__":
    import sys
    force_flag = "--force" in sys.argv
    seed_admin(force=force_flag)
