from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt
import os
import logging
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create app and router
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # 'admin', 'employee', 'receptionist'
    department: Optional[str] = None
    phone: Optional[str] = None
    permissions: List[str] = []  # User-defined permissions

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    permissions: List[str] = []
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MeetingRoomCreate(BaseModel):
    room_name: str
    room_code: str
    capacity: int
    floor: int
    amenities: List[str] = []
    equipment: List[str] = []
    images: List[str] = []

class MeetingRoomResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    room_name: str
    room_code: str
    capacity: int
    floor: int
    amenities: List[str]
    equipment: List[str]
    images: List[str]
    is_active: bool
    created_at: datetime

class BookingCreate(BaseModel):
    room_code: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees_internal: List[str] = []  # emails
    attendees_external: List[str] = []

class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    room_code: str
    room_name: str
    booked_by_email: str
    booked_by_name: str
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    attendees_internal: List[str]
    attendees_external: List[str]
    status: str
    created_at: datetime

class GuestCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    company: str
    purpose: str
    host_employee_email: str
    meeting_room_code: Optional[str] = None
    visit_date: datetime
    expected_arrival: datetime
    expected_departure: datetime

class GuestCheckIn(BaseModel):
    visitor_badge_number: str
    photo_url: Optional[str] = None
    id_proof_type: Optional[str] = None
    notes: Optional[str] = None

class GuestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str
    email: str
    phone: str
    company: str
    purpose: str
    host_employee_name: str
    host_employee_email: str
    meeting_room_name: Optional[str]
    visit_date: datetime
    expected_arrival: datetime
    expected_departure: datetime
    actual_arrival: Optional[datetime]
    actual_departure: Optional[datetime]
    status: str
    visitor_badge_number: Optional[str]
    photo_url: Optional[str]
    id_proof_type: Optional[str]
    notes: Optional[str]
    created_at: datetime

class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class AIChatResponse(BaseModel):
    response: str
    session_id: str

class RoomRecommendationRequest(BaseModel):
    meeting_title: str
    description: Optional[str] = None
    attendee_count: int
    start_time: datetime
    end_time: datetime
    required_amenities: List[str] = []

class WalkInVisitorCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    company: Optional[str] = None
    id_passport_number: str
    vehicle_plate: Optional[str] = None
    host_employee_email: str
    purpose: str  # 'Business Meeting', 'Interview', 'Delivery', 'Maintenance', 'Casual Worker', 'Other'
    arrival_time: datetime
    additional_notes: Optional[str] = None

class MeetingRoomUpdate(BaseModel):
    room_name: Optional[str] = None
    capacity: Optional[int] = None
    floor: Optional[int] = None
    amenities: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    images: Optional[List[str]] = None

class UserPermissionsUpdate(BaseModel):
    permissions: List[str]


# ============= UTILITY FUNCTIONS =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin only: Register new user"""
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    user_dict["is_active"] = True
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    
    user_dict.pop("password_hash")
    user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    return UserResponse(**user_dict)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login endpoint"""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    token = create_access_token({"email": user["email"], "role": user["role"]})
    
    user.pop("_id")
    user.pop("password_hash")
    user["created_at"] = datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(**user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    current_user["created_at"] = datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    return UserResponse(**current_user)

# ============= USER MANAGEMENT (ADMIN) =============

@api_router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: List all users"""
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        user["created_at"] = datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    
    return [UserResponse(**user) for user in users]

@api_router.patch("/users/{email}/toggle-status")
async def toggle_user_status(
    email: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Activate/deactivate user"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"email": email},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"email": email, "is_active": new_status}

@api_router.patch("/users/{email}/permissions")
async def update_user_permissions(
    email: str,
    permissions_data: UserPermissionsUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Update user permissions"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"email": email},
        {"$set": {"permissions": permissions_data.permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"email": email, "permissions": permissions_data.permissions}

@api_router.get("/users/employees/list")
async def list_employees(current_user: dict = Depends(get_current_user)):
    """Get list of all employees for dropdown"""
    employees = await db.users.find(
        {"role": {"$in": ["employee", "admin"]}, "is_active": True},
        {"_id": 0, "email": 1, "full_name": 1}
    ).to_list(1000)
    
    return employees


# ============= MEETING ROOMS =============

@api_router.post("/rooms", response_model=MeetingRoomResponse)
async def create_room(
    room_data: MeetingRoomCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Create meeting room"""
    existing_room = await db.meeting_rooms.find_one({"room_code": room_data.room_code})
    if existing_room:
        raise HTTPException(status_code=400, detail="Room code already exists")
    
    room_dict = room_data.model_dump()
    room_dict["is_active"] = True
    room_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    room_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.meeting_rooms.insert_one(room_dict)
    
    room_dict["created_at"] = datetime.fromisoformat(room_dict["created_at"])
    return MeetingRoomResponse(**room_dict)

@api_router.get("/rooms", response_model=List[MeetingRoomResponse])
async def list_rooms(
    floor: Optional[int] = None,
    min_capacity: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all active meeting rooms"""
    query = {"is_active": True}
    if floor is not None:
        query["floor"] = floor
    if min_capacity:
        query["capacity"] = {"$gte": min_capacity}
    
    rooms = await db.meeting_rooms.find(query, {"_id": 0}).to_list(1000)
    for room in rooms:
        room["created_at"] = datetime.fromisoformat(room["created_at"]) if isinstance(room["created_at"], str) else room["created_at"]
    
    return [MeetingRoomResponse(**room) for room in rooms]

@api_router.get("/rooms/availability")
async def check_room_availability(
    start_time: datetime,
    end_time: datetime,
    capacity: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Check which rooms are available in a time slot"""
    # Get all active rooms
    query = {"is_active": True}
    if capacity:
        query["capacity"] = {"$gte": capacity}
    
    rooms = await db.meeting_rooms.find(query, {"_id": 0}).to_list(1000)
    
    # Find conflicting bookings
    conflicting_bookings = await db.bookings.find({
        "status": "confirmed",
        "$or": [
            {"start_time": {"$lt": end_time.isoformat()}, "end_time": {"$gt": start_time.isoformat()}}
        ]
    }, {"_id": 0}).to_list(1000)
    
    booked_room_codes = {booking["room_code"] for booking in conflicting_bookings}
    
    available_rooms = [room for room in rooms if room["room_code"] not in booked_room_codes]
    
    for room in available_rooms:
        room["created_at"] = datetime.fromisoformat(room["created_at"]) if isinstance(room["created_at"], str) else room["created_at"]
    
    return available_rooms

@api_router.put("/rooms/{room_code}")
async def update_room(
    room_code: str,
    room_data: MeetingRoomUpdate,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Update meeting room"""
    room = await db.meeting_rooms.find_one({"room_code": room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    update_dict = {k: v for k, v in room_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.meeting_rooms.update_one(
            {"room_code": room_code},
            {"$set": update_dict}
        )
    
    updated_room = await db.meeting_rooms.find_one({"room_code": room_code}, {"_id": 0})
    updated_room["created_at"] = datetime.fromisoformat(updated_room["created_at"]) if isinstance(updated_room["created_at"], str) else updated_room["created_at"]
    
    return MeetingRoomResponse(**updated_room)

@api_router.patch("/rooms/{room_code}/toggle-status")
async def toggle_room_status(
    room_code: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Activate/deactivate room"""
    room = await db.meeting_rooms.find_one({"room_code": room_code})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    new_status = not room.get("is_active", True)
    await db.meeting_rooms.update_one(
        {"room_code": room_code},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"room_code": room_code, "is_active": new_status}

@api_router.get("/rooms/all", response_model=List[MeetingRoomResponse])
async def list_all_rooms(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: List ALL rooms including inactive"""
    rooms = await db.meeting_rooms.find({}, {"_id": 0}).to_list(1000)
    for room in rooms:
        room["created_at"] = datetime.fromisoformat(room["created_at"]) if isinstance(room["created_at"], str) else room["created_at"]
    
    return [MeetingRoomResponse(**room) for room in rooms]


# ============= BOOKINGS =============

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    current_user: dict = Depends(require_role(["employee", "admin"]))
):
    """Create meeting room booking"""
    # Verify room exists
    room = await db.meeting_rooms.find_one({"room_code": booking_data.room_code, "is_active": True})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check for conflicts
    conflicts = await db.bookings.find_one({
        "room_code": booking_data.room_code,
        "status": "confirmed",
        "$or": [
            {"start_time": {"$lt": booking_data.end_time.isoformat()}, "end_time": {"$gt": booking_data.start_time.isoformat()}}
        ]
    })
    
    if conflicts:
        raise HTTPException(status_code=409, detail="Room is already booked for this time slot")
    
    booking_dict = booking_data.model_dump()
    booking_dict["booked_by_email"] = current_user["email"]
    booking_dict["booked_by_name"] = current_user["full_name"]
    booking_dict["room_name"] = room["room_name"]
    booking_dict["status"] = "confirmed"
    booking_dict["start_time"] = booking_dict["start_time"].isoformat()
    booking_dict["end_time"] = booking_dict["end_time"].isoformat()
    booking_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    booking_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    booking_dict["ai_suggested"] = False
    
    await db.bookings.insert_one(booking_dict)
    
    booking_dict["start_time"] = datetime.fromisoformat(booking_dict["start_time"])
    booking_dict["end_time"] = datetime.fromisoformat(booking_dict["end_time"])
    booking_dict["created_at"] = datetime.fromisoformat(booking_dict["created_at"])
    
    return BookingResponse(**booking_dict)

@api_router.get("/bookings", response_model=List[BookingResponse])
async def list_bookings(
    room_code: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List bookings (role-based access)"""
    query = {}
    
    # Employee can only see their own bookings
    if current_user["role"] == "employee":
        query["booked_by_email"] = current_user["email"]
    
    if room_code:
        query["room_code"] = room_code
    if status:
        query["status"] = status
    if date:
        # Filter bookings for a specific date
        start_of_day = f"{date}T00:00:00"
        end_of_day = f"{date}T23:59:59"
        query["start_time"] = {"$gte": start_of_day, "$lte": end_of_day}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
    
    for booking in bookings:
        booking["start_time"] = datetime.fromisoformat(booking["start_time"]) if isinstance(booking["start_time"], str) else booking["start_time"]
        booking["end_time"] = datetime.fromisoformat(booking["end_time"]) if isinstance(booking["end_time"], str) else booking["end_time"]
        booking["created_at"] = datetime.fromisoformat(booking["created_at"]) if isinstance(booking["created_at"], str) else booking["created_at"]
    
    return [BookingResponse(**booking) for booking in bookings]

@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel booking - Admin can cancel any, Employee only own"""
    # For simplicity, using start_time + room_code as identifier
    # In production, use proper ObjectId
    booking = await db.bookings.find_one({"room_code": booking_id.split("_")[0]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check permissions - Admin and Receptionist can cancel any booking
    if current_user["role"] not in ["admin", "receptionist"] and booking["booked_by_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Can only cancel your own bookings")
    
    await db.bookings.update_one(
        {"room_code": booking["room_code"], "start_time": booking["start_time"]},
        {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Booking cancelled successfully"}

# ============= GUESTS =============

@api_router.post("/guests", response_model=GuestResponse)
async def create_guest(
    guest_data: GuestCreate,
    current_user: dict = Depends(require_role(["employee", "admin"]))
):
    """Employee: Invite guest"""
    # Verify host employee exists
    host = await db.users.find_one({"email": guest_data.host_employee_email})
    if not host:
        raise HTTPException(status_code=404, detail="Host employee not found")
    
    # Verify meeting room if provided
    meeting_room_name = None
    if guest_data.meeting_room_code:
        room = await db.meeting_rooms.find_one({"room_code": guest_data.meeting_room_code})
        if room:
            meeting_room_name = room["room_name"]
    
    guest_dict = guest_data.model_dump()
    guest_dict["host_employee_name"] = host["full_name"]
    guest_dict["meeting_room_name"] = meeting_room_name
    guest_dict["status"] = "expected"
    guest_dict["visit_date"] = guest_dict["visit_date"].isoformat()
    guest_dict["expected_arrival"] = guest_dict["expected_arrival"].isoformat()
    guest_dict["expected_departure"] = guest_dict["expected_departure"].isoformat()
    guest_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    guest_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.guests.insert_one(guest_dict)
    
    guest_dict["visit_date"] = datetime.fromisoformat(guest_dict["visit_date"])
    guest_dict["expected_arrival"] = datetime.fromisoformat(guest_dict["expected_arrival"])
    guest_dict["expected_departure"] = datetime.fromisoformat(guest_dict["expected_departure"])
    guest_dict["created_at"] = datetime.fromisoformat(guest_dict["created_at"])
    
    return GuestResponse(**guest_dict)

@api_router.get("/guests", response_model=List[GuestResponse])
async def list_guests(
    status: Optional[str] = None,
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List guests (role-based access)"""
    query = {}
    
    # Employee can only see their invited guests
    if current_user["role"] == "employee":
        query["host_employee_email"] = current_user["email"]
    
    if status:
        query["status"] = status
    if date:
        query["visit_date"] = {"$gte": f"{date}T00:00:00", "$lte": f"{date}T23:59:59"}
    
    guests = await db.guests.find(query, {"_id": 0}).to_list(1000)
    
    for guest in guests:
        guest["visit_date"] = datetime.fromisoformat(guest["visit_date"]) if isinstance(guest["visit_date"], str) else guest["visit_date"]
        guest["expected_arrival"] = datetime.fromisoformat(guest["expected_arrival"]) if isinstance(guest["expected_arrival"], str) else guest["expected_arrival"]
        guest["expected_departure"] = datetime.fromisoformat(guest["expected_departure"]) if isinstance(guest["expected_departure"], str) else guest["expected_departure"]
        guest["created_at"] = datetime.fromisoformat(guest["created_at"]) if isinstance(guest["created_at"], str) else guest["created_at"]
        
        if guest.get("actual_arrival"):
            guest["actual_arrival"] = datetime.fromisoformat(guest["actual_arrival"]) if isinstance(guest["actual_arrival"], str) else guest["actual_arrival"]
        if guest.get("actual_departure"):
            guest["actual_departure"] = datetime.fromisoformat(guest["actual_departure"]) if isinstance(guest["actual_departure"], str) else guest["actual_departure"]
    
    return [GuestResponse(**guest) for guest in guests]

@api_router.post("/guests/{guest_email}/check-in")
async def check_in_guest(
    guest_email: str,
    check_in_data: GuestCheckIn,
    current_user: dict = Depends(require_role(["receptionist", "admin"]))
):
    """Receptionist: Check in guest"""
    guest = await db.guests.find_one({"email": guest_email, "status": "expected"})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found or already checked in")
    
    update_data = check_in_data.model_dump()
    update_data["status"] = "checked_in"
    update_data["actual_arrival"] = datetime.now(timezone.utc).isoformat()
    update_data["checked_in_by_email"] = current_user["email"]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.guests.update_one({"email": guest_email}, {"$set": update_data})
    
    return {"message": "Guest checked in successfully", "email": guest_email}

@api_router.post("/guests/{guest_email}/check-out")
async def check_out_guest(
    guest_email: str,
    current_user: dict = Depends(require_role(["receptionist", "admin"]))
):
    """Receptionist: Check out guest"""
    guest = await db.guests.find_one({"email": guest_email, "status": "checked_in"})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found or not checked in")
    
    await db.guests.update_one(
        {"email": guest_email},
        {"$set": {
            "status": "checked_out",
            "actual_departure": datetime.now(timezone.utc).isoformat(),
            "checked_out_by_email": current_user["email"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Guest checked out successfully", "email": guest_email}

@api_router.post("/guests/walk-in")
async def create_walk_in_visitor(
    visitor_data: WalkInVisitorCreate,
    current_user: dict = Depends(require_role(["receptionist", "admin"]))
):
    """Receptionist: Register walk-in visitor"""
    # Verify host employee exists
    host = await db.users.find_one({"email": visitor_data.host_employee_email})
    if not host:
        raise HTTPException(status_code=404, detail="Host employee not found")
    
    visitor_dict = visitor_data.model_dump()
    visitor_dict["host_employee_name"] = host["full_name"]
    visitor_dict["status"] = "checked_in"  # Walk-ins are immediately checked-in
    visitor_dict["visit_date"] = visitor_dict["arrival_time"]
    visitor_dict["expected_arrival"] = visitor_dict["arrival_time"]
    visitor_dict["actual_arrival"] = visitor_dict["arrival_time"]
    visitor_dict["checked_in_by_email"] = current_user["email"]
    visitor_dict["visitor_badge_number"] = f"WI-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    visitor_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    visitor_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Convert datetime to ISO string
    visitor_dict["arrival_time"] = visitor_dict["arrival_time"].isoformat()
    visitor_dict["visit_date"] = visitor_dict["visit_date"].isoformat()
    visitor_dict["expected_arrival"] = visitor_dict["expected_arrival"].isoformat()
    visitor_dict["actual_arrival"] = visitor_dict["actual_arrival"].isoformat()
    
    await db.guests.insert_one(visitor_dict)
    
    # TODO: Send email notification to host employee
    # For now, just log it
    logger.info(f"Walk-in visitor {visitor_dict['full_name']} checked in for {host['full_name']}")
    
    return {
        "message": "Walk-in visitor registered successfully",
        "visitor_name": visitor_dict["full_name"],
        "badge_number": visitor_dict["visitor_badge_number"],
        "host_name": host["full_name"]
    }


# ============= AI ASSISTANT =============

@api_router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(
    chat_request: AIChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """AI chatbot for booking assistance"""
    try:
        # Get available rooms context
        rooms = await db.meeting_rooms.find({"is_active": True}, {"_id": 0}).to_list(100)
        rooms_context = "\n".join([
            f"- {room['room_name']} (Code: {room['room_code']}, Capacity: {room['capacity']}, Floor: {room['floor']}, Amenities: {', '.join(room['amenities'])})"
            for room in rooms
        ])
        
        system_message = f"""You are an AI assistant for a corporate meeting room booking system. 
Help users find and book meeting rooms based on their needs.

Available rooms:
{rooms_context}

Current user: {current_user['full_name']} ({current_user['role']})

Provide helpful, concise responses about room availability, features, and booking recommendations."""
        
        # Initialize chat
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"{current_user['email']}_{chat_request.session_id}",
            system_message=system_message
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        # Send message
        user_message = UserMessage(text=chat_request.message)
        response = await chat.send_message(user_message)
        
        # Store in chat history
        await db.ai_chat_history.update_one(
            {"user_email": current_user["email"], "session_id": chat_request.session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": chat_request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                        ]
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return AIChatResponse(response=response, session_id=chat_request.session_id)
    
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI service error")

@api_router.post("/ai/recommend-room")
async def recommend_room(
    request: RoomRecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """AI-powered smart room recommendation"""
    try:
        # Get available rooms
        rooms = await db.meeting_rooms.find({"is_active": True}, {"_id": 0}).to_list(100)
        
        # Filter by capacity
        suitable_rooms = [r for r in rooms if r["capacity"] >= request.attendee_count]
        
        # Check availability
        conflicting_bookings = await db.bookings.find({
            "status": "confirmed",
            "$or": [
                {"start_time": {"$lt": request.end_time.isoformat()}, "end_time": {"$gt": request.start_time.isoformat()}}
            ]
        }, {"_id": 0}).to_list(1000)
        
        booked_room_codes = {booking["room_code"] for booking in conflicting_bookings}
        available_rooms = [r for r in suitable_rooms if r["room_code"] not in booked_room_codes]
        
        if not available_rooms:
            return {"recommendations": [], "message": "No rooms available for the requested time"}
        
        # Use AI to rank rooms
        rooms_info = "\n".join([
            f"{i+1}. {r['room_name']} - Capacity: {r['capacity']}, Floor: {r['floor']}, Amenities: {', '.join(r['amenities'])}"
            for i, r in enumerate(available_rooms)
        ])
        
        prompt = f"""Based on this meeting request:
Title: {request.meeting_title}
Description: {request.description or 'N/A'}
Attendees: {request.attendee_count}
Required amenities: {', '.join(request.required_amenities) if request.required_amenities else 'None specified'}

Available rooms:
{rooms_info}

Recommend the top 3 rooms in order of suitability. For each, briefly explain why it's a good match.
Format: Room name - Brief reason (one sentence)"""
        
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id="room_recommendation",
            system_message="You are a meeting room recommendation expert. Provide concise, helpful recommendations."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            "recommendations": available_rooms[:3],
            "ai_analysis": response,
            "total_available": len(available_rooms)
        }
    
    except Exception as e:
        logger.error(f"Room recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Recommendation service error")

# ============= ANALYTICS =============

@api_router.get("/analytics/room-utilization")
async def get_room_utilization(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Room utilization analytics"""
    query = {"status": "confirmed"}
    if start_date and end_date:
        query["start_time"] = {"$gte": start_date, "$lte": end_date}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate utilization by room
    utilization = {}
    for booking in bookings:
        room_code = booking["room_code"]
        if room_code not in utilization:
            utilization[room_code] = {
                "room_name": booking["room_name"],
                "total_bookings": 0,
                "total_hours": 0
            }
        
        start = datetime.fromisoformat(booking["start_time"]) if isinstance(booking["start_time"], str) else booking["start_time"]
        end = datetime.fromisoformat(booking["end_time"]) if isinstance(booking["end_time"], str) else booking["end_time"]
        hours = (end - start).total_seconds() / 3600
        
        utilization[room_code]["total_bookings"] += 1
        utilization[room_code]["total_hours"] += hours
    
    return {"utilization": utilization}

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    current_user: dict = Depends(require_role(["admin"]))
):
    """Admin: Dashboard analytics"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Today's bookings
    today_bookings = await db.bookings.count_documents({
        "status": "confirmed",
        "start_time": {"$gte": f"{today}T00:00:00", "$lte": f"{today}T23:59:59"}
    })
    
    # Active guests
    active_guests = await db.guests.count_documents({"status": "checked_in"})
    
    # Total rooms
    total_rooms = await db.meeting_rooms.count_documents({"is_active": True})
    
    # Total users
    total_users = await db.users.count_documents({"is_active": True})
    
    return {
        "today_bookings": today_bookings,
        "active_guests": active_guests,
        "total_rooms": total_rooms,
        "total_users": total_users
    }

# ============= DASHBOARD DATA =============

@api_router.get("/dashboard/employee")
async def get_employee_dashboard(
    current_user: dict = Depends(require_role(["employee"]))
):
    """Employee dashboard data"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Upcoming bookings
    upcoming_bookings = await db.bookings.find({
        "booked_by_email": current_user["email"],
        "status": "confirmed",
        "start_time": {"$gte": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0}).sort("start_time", 1).to_list(10)
    
    # Today's invited guests
    today_guests = await db.guests.find({
        "host_employee_email": current_user["email"],
        "visit_date": {"$gte": f"{today}T00:00:00", "$lte": f"{today}T23:59:59"}
    }, {"_id": 0}).to_list(100)
    
    return {
        "upcoming_bookings": upcoming_bookings,
        "today_guests": today_guests
    }

@api_router.get("/dashboard/receptionist")
async def get_receptionist_dashboard(
    current_user: dict = Depends(require_role(["receptionist"]))
):
    """Receptionist dashboard data"""
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Today's expected visitors
    expected_visitors = await db.guests.find({
        "visit_date": {"$gte": f"{today}T00:00:00", "$lte": f"{today}T23:59:59"},
        "status": "expected"
    }, {"_id": 0}).to_list(100)
    
    # Currently checked-in guests
    checked_in_guests = await db.guests.find({
        "status": "checked_in"
    }, {"_id": 0}).to_list(100)
    
    # Today's bookings for room occupancy
    today_bookings = await db.bookings.find({
        "start_time": {"$gte": f"{today}T00:00:00", "$lte": f"{today}T23:59:59"},
        "status": "confirmed"
    }, {"_id": 0}).to_list(100)
    
    return {
        "expected_visitors": expected_visitors,
        "checked_in_guests": checked_in_guests,
        "today_bookings": today_bookings
    }

# ============= SEED ADMIN =============

@app.on_event("startup")
async def seed_admin():
    """Create default admin if none exists"""
    admin_exists = await db.users.find_one({"role": "admin"})
    if not admin_exists:
        admin_data = {
            "email": "admin@company.com",
            "password_hash": hash_password("admin123"),
            "full_name": "System Administrator",
            "role": "admin",
            "department": "IT",
            "phone": "+1234567890",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_data)
        logger.info("Default admin user created: admin@company.com / admin123")
        
        # Save credentials
        creds_file = Path("/app/memory/test_credentials.md")
        creds_file.parent.mkdir(parents=True, exist_ok=True)
        creds_file.write_text("""# Test Credentials

## Admin Account
- Email: admin@company.com
- Password: admin123

## Test Employee Account
- Email: employee@company.com
- Password: employee123

## Test Receptionist Account
- Email: receptionist@company.com
- Password: receptionist123
""")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
