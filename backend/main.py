from datetime import datetime, timezone
import re
import secrets
from typing import List, Optional, Set
import bcrypt
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    from database import get_connection, init_db
except ImportError:
    from backend.database import get_connection, init_db

init_db()

ALLOWED_USER_TYPES = {"worker", "owner", "admin"}
ALLOWED_MEAL_TYPES = {"Breakfast", "Lunch", "Snack", "Dinner"}

def load_users() -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    conn.close()
    return {row["username"]: dict(row) for row in rows}

def authenticate_request(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if token:
        token = token.strip().strip('"').strip("'")
    if not token:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip().strip('"').strip("'")
        elif auth_header:
            token = auth_header.strip().strip('"').strip("'")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    users = load_users()
    for u in users.values():
        try:
            if bcrypt.checkpw(u["username"].encode("utf-8"), token.encode("utf-8")):
                return u
        except Exception:
            continue

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalid or expired",
    )

def require_roles(request: Request, allowed_roles: Set[str]) -> dict:
    user = authenticate_request(request)
    user_role = (user.get("user_type") or user.get("role") or "").lower()
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Owner or Admin role required",
        )
    return user

app = FastAPI(title="Canteen Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://canteenmgmt.onrender.com",
        "https://canteenmgmt.onrender.com/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None
    save_user: bool = False
    quick_login: bool = False

class CreateUserRequest(BaseModel):
    username: str
    password: str
    full_name: str
    user_type: str = "worker"
    avatar: str = "executive"

class CreateItemRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    category: Optional[str] = "General"
    is_available: Optional[bool] = True

class SaleItemPayload(BaseModel):
    item_id: Optional[int] = None
    item_name: str
    quantity: int = 1
    unit_price: float

class CreatePatientRequest(BaseModel):
    name: str
    mobile_number: Optional[str] = ""
    ward_number: Optional[str] = ""

class CreateSaleRequest(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    customer_phone: Optional[str] = ""
    ward_number: Optional[str] = ""
    patient_id: Optional[int] = None
    meal_type: str = "Snack"
    items: List[SaleItemPayload]

class StockExpenseRequest(BaseModel):
    date: Optional[str] = None
    item_name: str
    category: Optional[str] = "General"
    quantity: float
    unit: str = "Kg"
    unit_price: float
    notes: Optional[str] = ""

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/auth/login")
def login(creds: LoginRequest, request: Request, response: Response):
    username = creds.username.strip().lower()
    users = load_users()
    user = users.get(username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not creds.quick_login:
        if not creds.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required",
            )
        is_password_valid = bcrypt.checkpw(
            creds.password.encode("utf-8"),
            user["password_hash"].encode("utf-8"),
        )
        if not is_password_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

    token = bcrypt.hashpw(username.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    max_age_seconds = 86400 * 7 if creds.save_user else 86400

    is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    samesite_val = "none" if is_https else "lax"
    secure_val = True if is_https else False

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite=samesite_val,
        secure=secure_val,
        max_age=max_age_seconds,
        path="/",
    )

    return {
        "username": user["username"],
        "role": user.get("role", user.get("user_type", "worker")),
        "user_type": user.get("user_type", user.get("role", "worker")),
        "full_name": user["full_name"],
        "avatar": user.get("avatar", "executive"),
        "access_token": token,
        "token_type": "bearer",
    }

@app.get("/api/auth/me")
def get_current_user(request: Request):
    user = authenticate_request(request)
    return {
        "username": user["username"],
        "role": user.get("role", user.get("user_type", "worker")),
        "user_type": user.get("user_type", user.get("role", "worker")),
        "full_name": user["full_name"],
        "avatar": user.get("avatar", "executive"),
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https"
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        samesite="none" if is_https else "lax",
        secure=is_https,
    )
    return {"message": "Logged out successfully"}

@app.get("/api/users")
def get_all_users(request: Request):
    authenticate_request(request)
    users = load_users()
    sanitized_users = []
    for u in users.values():
        sanitized_users.append({
            "username": u["username"],
            "full_name": u["full_name"],
            "user_type": u.get("user_type", u.get("role", "worker")),
            "role": u.get("role", u.get("user_type", "worker")),
            "avatar": u.get("avatar", "executive"),
            "created_at": u.get("created_at"),
        })
    return sanitized_users

@app.post("/api/users", status_code=status.HTTP_201_CREATED)
def create_user(req: CreateUserRequest, request: Request):
    authenticate_request(request)

    username = req.username.strip().lower()
    full_name = req.full_name.strip()
    password = req.password.strip()
    user_type = req.user_type.strip().lower()
    avatar = req.avatar.strip().lower()

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    if not re.match(r"^[a-zA-Z0-9_]{3,20}$", username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-20 characters long and contain only letters, numbers, and underscores",
        )

    if len(full_name) < 2 or len(full_name) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be between 2 and 50 characters",
        )

    if len(password) < 6 or len(password) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be between 6 and 100 characters",
        )

    if user_type not in ALLOWED_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User type must be one of: worker, owner, admin",
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{username}' is already taken",
        )

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO users (username, password_hash, full_name, role, user_type, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (username, password_hash, full_name, user_type, user_type, avatar, now_iso))
    conn.commit()
    conn.close()

    return {
        "username": username,
        "full_name": full_name,
        "role": user_type,
        "user_type": user_type,
        "avatar": avatar,
        "created_at": now_iso,
    }

@app.delete("/api/users/{username}")
def delete_user(username: str, request: Request):
    authenticate_request(request)
    target = username.strip().lower()

    if target == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The primary administrator account cannot be deleted",
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ?", (target,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    cursor.execute("DELETE FROM users WHERE username = ?", (target,))
    conn.commit()
    conn.close()

    return {"message": f"User '{target}' deleted successfully"}

@app.get("/api/items")
def get_items(request: Request):
    require_roles(request, {"admin", "owner"})
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/items", status_code=status.HTTP_201_CREATED)
def create_item(req: CreateItemRequest, request: Request):
    require_roles(request, {"admin", "owner"})

    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required",
        )

    if req.price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price cannot be negative",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO items (name, description, price, category, is_available, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        name,
        req.description.strip() if req.description else "",
        req.price,
        req.category.strip() if req.category else "General",
        1 if req.is_available else 0,
        now_iso,
    ))
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": item_id,
        "name": name,
        "description": req.description.strip() if req.description else "",
        "price": req.price,
        "category": req.category.strip() if req.category else "General",
        "is_available": 1 if req.is_available else 0,
        "created_at": now_iso,
    }

@app.put("/api/items/{item_id}")
def update_item(item_id: int, req: CreateItemRequest, request: Request):
    require_roles(request, {"admin", "owner"})

    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required",
        )

    if req.price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price cannot be negative",
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM items WHERE id = ?", (item_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )

    cursor.execute("""
    UPDATE items
    SET name = ?, description = ?, price = ?, category = ?, is_available = ?
    WHERE id = ?
    """, (
        name,
        req.description.strip() if req.description else "",
        req.price,
        req.category.strip() if req.category else "General",
        1 if req.is_available else 0,
        item_id,
    ))
    conn.commit()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()

    return dict(row)

@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, request: Request):
    require_roles(request, {"admin", "owner"})

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Item deleted"}

@app.get("/api/sales")
def get_sales(
    request: Request,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    all_dates: bool = False,
    meal_type: Optional[str] = None,
    cashier: Optional[str] = None,
):
    authenticate_request(request)

    conn = get_connection()
    cursor = conn.cursor()

    query = """
    SELECT s.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.username
    WHERE 1=1
    """
    params = []

    if all_dates:
        pass
    elif start_date and end_date:
        query += " AND s.created_at >= ? AND s.created_at <= ?"
        params.extend([f"{start_date}T00:00:00", f"{end_date}T23:59:59.999999"])
    elif start_date:
        query += " AND s.created_at >= ?"
        params.append(f"{start_date}T00:00:00")
    elif end_date:
        query += " AND s.created_at <= ?"
        params.append(f"{end_date}T23:59:59.999999")
    elif date:
        query += " AND s.created_at LIKE ?"
        params.append(f"{date}%")
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
        query += " AND s.created_at LIKE ?"
        params.append(f"{target_date}%")

    if meal_type and meal_type != "All":
        query += " AND s.meal_type = ?"
        params.append(meal_type)

    if cashier and cashier != "All":
        query += " AND s.created_by = ?"
        params.append(cashier)

    query += " ORDER BY s.id DESC"

    cursor.execute(query, tuple(params))
    sales_rows = cursor.fetchall()
    sales_list = []

    for s in sales_rows:
        sale_dict = dict(s)
        cursor.execute("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC", (s["id"],))
        sale_dict["items"] = [dict(item) for item in cursor.fetchall()]
        sales_list.append(sale_dict)

    conn.close()
    return sales_list

@app.get("/api/sales/summary")
def get_sales_summary(
    request: Request,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    all_dates: bool = False,
    meal_type: Optional[str] = None,
    cashier: Optional[str] = None,
):
    authenticate_request(request)

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT s.id, s.total_amount, s.meal_type, s.created_at FROM sales s WHERE 1=1"
    params = []

    if all_dates:
        pass
    elif start_date and end_date:
        query += " AND s.created_at >= ? AND s.created_at <= ?"
        params.extend([f"{start_date}T00:00:00", f"{end_date}T23:59:59.999999"])
    elif start_date:
        query += " AND s.created_at >= ?"
        params.append(f"{start_date}T00:00:00")
    elif end_date:
        query += " AND s.created_at <= ?"
        params.append(f"{end_date}T23:59:59.999999")
    elif date:
        query += " AND s.created_at LIKE ?"
        params.append(f"{date}%")
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
        query += " AND s.created_at LIKE ?"
        params.append(f"{target_date}%")

    if meal_type and meal_type != "All":
        query += " AND s.meal_type = ?"
        params.append(meal_type)

    if cashier and cashier != "All":
        query += " AND s.created_by = ?"
        params.append(cashier)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    total_revenue = sum(r["total_amount"] for r in rows)
    total_orders = len(rows)
    meal_breakdown = {"Breakfast": 0, "Lunch": 0, "Snack": 0, "Dinner": 0}
    meal_revenue = {"Breakfast": 0.0, "Lunch": 0.0, "Snack": 0.0, "Dinner": 0.0}

    for r in rows:
        mt = r["meal_type"]
        if mt in meal_breakdown:
            meal_breakdown[mt] += 1
            meal_revenue[mt] += float(r["total_amount"])

    sale_ids = [r["id"] for r in rows]
    top_items = []
    if sale_ids:
        placeholders = ",".join("?" for _ in sale_ids)
        cursor.execute(f"""
        SELECT item_name, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue
        FROM sale_items
        WHERE sale_id IN ({placeholders})
        GROUP BY item_name
        ORDER BY total_qty DESC
        LIMIT 10
        """, tuple(sale_ids))
        top_items = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "start_date": start_date or date or datetime.now().strftime("%Y-%m-%d"),
        "end_date": end_date or date or datetime.now().strftime("%Y-%m-%d"),
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "meal_breakdown": meal_breakdown,
        "meal_revenue": meal_revenue,
        "top_items": top_items,
    }

@app.get("/api/sales/overview-stats")
def get_overview_stats(request: Request):
    authenticate_request(request)

    today = datetime.now().strftime("%Y-%m-%d")
    month_prefix = datetime.now().strftime("%Y-%m")
    month_label = datetime.now().strftime("%B %Y")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT total_amount, meal_type
    FROM sales
    WHERE created_at LIKE ?
    """, (f"{today}%",))
    today_rows = cursor.fetchall()
    today_revenue = sum(r["total_amount"] for r in today_rows)
    today_orders = len(today_rows)
    today_meals = {"Breakfast": 0, "Lunch": 0, "Snack": 0, "Dinner": 0}
    for r in today_rows:
        mt = r["meal_type"]
        if mt in today_meals:
            today_meals[mt] += 1

    cursor.execute("""
    SELECT total_amount
    FROM sales
    WHERE created_at LIKE ?
    """, (f"{month_prefix}%",))
    month_rows = cursor.fetchall()
    month_revenue = sum(r["total_amount"] for r in month_rows)
    month_orders = len(month_rows)

    cursor.execute("""
    SELECT si.item_name, SUM(si.quantity) as total_qty, SUM(si.subtotal) as total_sales
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.created_at LIKE ?
    GROUP BY si.item_name
    ORDER BY total_qty DESC
    LIMIT 5
    """, (f"{month_prefix}%",))
    top_selling = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
    SELECT s.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.username
    ORDER BY s.id DESC
    LIMIT 5
    """)
    recent_rows = cursor.fetchall()
    recent_sales = []
    for r in recent_rows:
        s_dict = dict(r)
        cursor.execute("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC", (r["id"],))
        s_dict["items"] = [dict(it) for it in cursor.fetchall()]
        recent_sales.append(s_dict)

    conn.close()

    return {
        "today": {
            "date": today,
            "revenue": today_revenue,
            "orders": today_orders,
            "meals": today_meals,
        },
        "month": {
            "month_label": month_label,
            "revenue": month_revenue,
            "orders": month_orders,
        },
        "top_selling_month": top_selling,
        "recent_sales": recent_sales,
    }

@app.post("/api/sales", status_code=status.HTTP_201_CREATED)
def create_sale(req: CreateSaleRequest, request: Request):
    current_user = authenticate_request(request)

    valid_items = [i for i in req.items if i.item_name.strip() and i.quantity > 0]
    if not valid_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid item is required",
        )

    total_amount = sum(i.quantity * i.unit_price for i in valid_items)
    now_iso = datetime.now(timezone.utc).isoformat()
    today_code = datetime.now().strftime("%Y%m%d")
    receipt_no = f"ORD-{today_code}-{secrets.token_hex(2).upper()}"

    customer_name = req.customer_name.strip() if req.customer_name and req.customer_name.strip() else "Walk-in Customer"
    customer_phone = req.customer_phone.strip() if req.customer_phone else ""
    ward_number = req.ward_number.strip() if req.ward_number else ""
    patient_id = req.patient_id
    meal_type = req.meal_type if req.meal_type in ALLOWED_MEAL_TYPES else "Snack"

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO sales (receipt_no, customer_name, customer_phone, ward_number, patient_id, meal_type, total_amount, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (receipt_no, customer_name, customer_phone, ward_number, patient_id, meal_type, total_amount, current_user["username"], now_iso))
    sale_id = cursor.lastrowid

    for item in valid_items:
        subtotal = item.quantity * item.unit_price
        cursor.execute("""
        INSERT INTO sale_items (sale_id, item_id, item_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (sale_id, item.item_id, item.item_name.strip(), item.quantity, item.unit_price, subtotal))

    conn.commit()

    cursor.execute("""
    SELECT s.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.username
    WHERE s.id = ?
    """, (sale_id,))
    sale_row = dict(cursor.fetchone())

    cursor.execute("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC", (sale_id,))
    sale_row["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return sale_row

@app.put("/api/sales/{sale_id}")
def update_sale(sale_id: int, req: CreateSaleRequest, request: Request):
    authenticate_request(request)

    valid_items = [i for i in req.items if i.item_name.strip() and i.quantity > 0]
    if not valid_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one valid item is required",
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sales WHERE id = ?", (sale_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale record not found",
        )

    total_amount = sum(i.quantity * i.unit_price for i in valid_items)
    now_iso = datetime.now(timezone.utc).isoformat()
    customer_name = req.customer_name.strip() if req.customer_name and req.customer_name.strip() else "Walk-in Customer"
    customer_phone = req.customer_phone.strip() if req.customer_phone else ""
    ward_number = req.ward_number.strip() if req.ward_number else ""
    patient_id = req.patient_id
    meal_type = req.meal_type if req.meal_type in ALLOWED_MEAL_TYPES else "Snack"

    cursor.execute("""
    UPDATE sales
    SET customer_name = ?, customer_phone = ?, ward_number = ?, patient_id = ?, meal_type = ?, total_amount = ?, updated_at = ?
    WHERE id = ?
    """, (customer_name, customer_phone, ward_number, patient_id, meal_type, total_amount, now_iso, sale_id))

    cursor.execute("DELETE FROM sale_items WHERE sale_id = ?", (sale_id,))

    for item in valid_items:
        subtotal = item.quantity * item.unit_price
        cursor.execute("""
        INSERT INTO sale_items (sale_id, item_id, item_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (sale_id, item.item_id, item.item_name.strip(), item.quantity, item.unit_price, subtotal))

    conn.commit()

    cursor.execute("""
    SELECT s.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM sales s
    LEFT JOIN users u ON s.created_by = u.username
    WHERE s.id = ?
    """, (sale_id,))
    sale_row = dict(cursor.fetchone())

    cursor.execute("SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC", (sale_id,))
    sale_row["items"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return sale_row

@app.get("/api/patients")
def get_patients(request: Request, search: Optional[str] = None):
    authenticate_request(request)
    conn = get_connection()
    cursor = conn.cursor()
    if search and search.strip():
        term = f"%{search.strip()}%"
        cursor.execute("""
        SELECT * FROM patients
        WHERE name LIKE ? OR mobile_number LIKE ? OR ward_number LIKE ?
        ORDER BY id DESC LIMIT 25
        """, (term, term, term))
    else:
        cursor.execute("SELECT * FROM patients ORDER BY name ASC LIMIT 100")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/patients", status_code=status.HTTP_201_CREATED)
def create_patient(req: CreatePatientRequest, request: Request):
    authenticate_request(request)
    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient name is required",
        )
    mobile = req.mobile_number.strip() if req.mobile_number else ""
    ward = req.ward_number.strip() if req.ward_number else ""
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO patients (name, mobile_number, ward_number, created_at)
    VALUES (?, ?, ?, ?)
    """, (name, mobile, ward, now_iso))
    patient_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = dict(cursor.fetchone())
    conn.close()
    return patient

@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: int, request: Request):
    require_roles(request, {"admin", "owner"})

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM sales WHERE id = ?", (sale_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale record not found",
        )

    cursor.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
    conn.commit()
    conn.close()

    return {"message": "Sale deleted successfully"}

@app.get("/api/stock-expenses")
def get_stock_expenses(
    request: Request,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    all_dates: bool = False,
    category: Optional[str] = None,
):
    authenticate_request(request)
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    SELECT se.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM stock_expenses se
    LEFT JOIN users u ON se.created_by = u.username
    WHERE 1=1
    """
    params = []

    if all_dates:
        pass
    elif start_date and end_date:
        query += " AND se.date >= ? AND se.date <= ?"
        params.extend([start_date, end_date])
    elif start_date:
        query += " AND se.date >= ?"
        params.append(start_date)
    elif end_date:
        query += " AND se.date <= ?"
        params.append(end_date)
    elif date:
        query += " AND se.date = ?"
        params.append(date)
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
        query += " AND se.date = ?"
        params.append(target_date)

    if category and category != "All":
        query += " AND se.category = ?"
        params.append(category)

    query += " ORDER BY se.date DESC, se.id DESC"
    cursor.execute(query, tuple(params))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/api/stock-expenses/summary")
def get_stock_expenses_summary(
    request: Request,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    all_dates: bool = False,
):
    authenticate_request(request)

    today = datetime.now().strftime("%Y-%m-%d")
    month_prefix = datetime.now().strftime("%Y-%m")

    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT total_cost, category FROM stock_expenses WHERE 1=1"
    params = []

    if all_dates:
        pass
    elif start_date and end_date:
        query += " AND date >= ? AND date <= ?"
        params.extend([start_date, end_date])
    elif start_date:
        query += " AND date >= ?"
        params.append(start_date)
    elif end_date:
        query += " AND date <= ?"
        params.append(end_date)
    elif date:
        query += " AND date = ?"
        params.append(date)
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")
        query += " AND date = ?"
        params.append(target_date)

    cursor.execute(query, tuple(params))
    filtered_rows = cursor.fetchall()
    period_expense = sum(r["total_cost"] for r in filtered_rows)
    period_count = len(filtered_rows)

    category_breakdown = {}
    for r in filtered_rows:
        cat = r["category"] or "General"
        category_breakdown[cat] = category_breakdown.get(cat, 0.0) + float(r["total_cost"])

    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at LIKE ?", (f"{today}%",))
    today_sales = float(cursor.fetchone()[0])

    cursor.execute("SELECT COALESCE(SUM(total_cost), 0) FROM stock_expenses WHERE date = ?", (today,))
    today_expenses = float(cursor.fetchone()[0])
    today_net_profit = today_sales - today_expenses

    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at LIKE ?", (f"{month_prefix}%",))
    month_sales = float(cursor.fetchone()[0])

    cursor.execute("SELECT COALESCE(SUM(total_cost), 0) FROM stock_expenses WHERE date LIKE ?", (f"{month_prefix}%",))
    month_expenses = float(cursor.fetchone()[0])
    month_net_profit = month_sales - month_expenses

    conn.close()

    return {
        "period_expense": period_expense,
        "period_count": period_count,
        "category_breakdown": category_breakdown,
        "today_sales": today_sales,
        "today_expenses": today_expenses,
        "today_net_profit": today_net_profit,
        "month_sales": month_sales,
        "month_expenses": month_expenses,
        "month_net_profit": month_net_profit,
    }

@app.post("/api/stock-expenses", status_code=status.HTTP_201_CREATED)
def create_stock_expense(req: StockExpenseRequest, request: Request):
    current_user = authenticate_request(request)

    item_name = req.item_name.strip()
    if not item_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required",
        )

    if req.quantity <= 0 or req.unit_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be positive and price cannot be negative",
        )

    date_val = req.date.strip() if req.date and req.date.strip() else datetime.now().strftime("%Y-%m-%d")
    category = req.category.strip() if req.category else "General"
    unit = req.unit.strip() if req.unit else "Kg"
    total_cost = round(req.quantity * req.unit_price, 2)
    notes = req.notes.strip() if req.notes else ""
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO stock_expenses (date, item_name, category, quantity, unit, unit_price, total_cost, notes, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (date_val, item_name, category, req.quantity, unit, req.unit_price, total_cost, notes, current_user["username"], now_iso))
    expense_id = cursor.lastrowid
    conn.commit()

    cursor.execute("""
    SELECT se.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM stock_expenses se
    LEFT JOIN users u ON se.created_by = u.username
    WHERE se.id = ?
    """, (expense_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

@app.put("/api/stock-expenses/{expense_id}")
def update_stock_expense(expense_id: int, req: StockExpenseRequest, request: Request):
    authenticate_request(request)

    item_name = req.item_name.strip()
    if not item_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item name is required",
        )

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM stock_expenses WHERE id = ?", (expense_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense entry not found",
        )

    date_val = req.date.strip() if req.date and req.date.strip() else datetime.now().strftime("%Y-%m-%d")
    category = req.category.strip() if req.category else "General"
    unit = req.unit.strip() if req.unit else "Kg"
    total_cost = round(req.quantity * req.unit_price, 2)
    notes = req.notes.strip() if req.notes else ""

    cursor.execute("""
    UPDATE stock_expenses
    SET date = ?, item_name = ?, category = ?, quantity = ?, unit = ?, unit_price = ?, total_cost = ?, notes = ?
    WHERE id = ?
    """, (date_val, item_name, category, req.quantity, unit, req.unit_price, total_cost, notes, expense_id))
    conn.commit()

    cursor.execute("""
    SELECT se.*, u.full_name as creator_name, u.avatar as creator_avatar, u.user_type as creator_role
    FROM stock_expenses se
    LEFT JOIN users u ON se.created_by = u.username
    WHERE se.id = ?
    """, (expense_id,))
    row = dict(cursor.fetchone())
    conn.close()
    return row

@app.delete("/api/stock-expenses/{expense_id}")
def delete_stock_expense(expense_id: int, request: Request):
    require_roles(request, {"admin", "owner"})

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM stock_expenses WHERE id = ?", (expense_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense entry not found",
        )

    cursor.execute("DELETE FROM stock_expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()

    return {"message": "Expense entry deleted successfully"}
