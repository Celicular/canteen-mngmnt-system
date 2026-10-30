from datetime import datetime, timezone
import json
import os
import sqlite3

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
DB_PATH = os.environ.get("SQLITE_DB_PATH", os.path.join(DATA_DIR, "canteen.db"))
LEGACY_USERS_FILE = os.path.join(DATA_DIR, "users.json")

def get_connection():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        user_type TEXT NOT NULL,
        avatar TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT DEFAULT 'General',
        is_available INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_no TEXT UNIQUE NOT NULL,
        customer_name TEXT DEFAULT 'Walk-in Customer',
        customer_phone TEXT DEFAULT '',
        meal_type TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY(created_by) REFERENCES users(username)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        item_id INTEGER,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile_number TEXT DEFAULT '',
        ward_number TEXT DEFAULT '',
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stock_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        item_name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        unit_price REAL NOT NULL,
        total_cost REAL NOT NULL,
        notes TEXT DEFAULT '',
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(created_by) REFERENCES users(username)
    );
    """)

    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN ward_number TEXT DEFAULT '';")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE sales ADD COLUMN patient_id INTEGER;")
    except Exception:
        pass

    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        if os.path.exists(LEGACY_USERS_FILE):
            try:
                with open(LEGACY_USERS_FILE, "r", encoding="utf-8") as f:
                    legacy_users = json.load(f)
                    for u in legacy_users.values():
                        cursor.execute("""
                        INSERT OR IGNORE INTO users (username, password_hash, full_name, role, user_type, avatar, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            u["username"],
                            u["password_hash"],
                            u["full_name"],
                            u.get("role", "admin"),
                            u.get("user_type", "admin"),
                            u.get("avatar", "executive"),
                            u.get("created_at", datetime.now(timezone.utc).isoformat()),
                        ))
            except Exception:
                pass

        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
            INSERT OR IGNORE INTO users (username, password_hash, full_name, role, user_type, avatar, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "admin",
                "$2b$12$wC0i2TTllCavbqK4J7iCrOcUO6vdNpm58GHjPqBUp43eilzRsZAeO",
                "Admin User",
                "admin",
                "admin",
                "executive",
                "2026-10-29T10:00:00Z",
            ))

    conn.commit()
    conn.close()
