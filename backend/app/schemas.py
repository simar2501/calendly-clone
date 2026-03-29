from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, time, date

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    timezone: str
    class Config:
        from_attributes = True

class EventTypeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int
    slug: str
    color: Optional[str] = "#006bff"
    location: Optional[str] = None
    is_single_use: Optional[bool] = False

class EventTypeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    slug: Optional[str] = None
    color: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None
    is_single_use: Optional[bool] = None

class EventTypeOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration: int
    slug: str
    color: Optional[str] = "#006bff"
    location: Optional[str] = None
    is_active: bool = True
    is_single_use: bool = False
    class Config:
        from_attributes = True

# ── Availability ───────────────────────────────────────────────────────────────
class AvailabilityItem(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

class AvailabilityOut(BaseModel):
    id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool
    class Config:
        from_attributes = True

class DateOverrideItem(BaseModel):
    date: date
    start_time: time
    end_time: time

class DateOverrideOut(BaseModel):
    id: int
    date: date
    start_time: time
    end_time: time
    class Config:
        from_attributes = True

class AvailabilityUpdate(BaseModel):
    availability: List[AvailabilityItem]
    date_overrides: Optional[List[DateOverrideItem]] = []

class AvailabilityResponse(BaseModel):
    availability: List[AvailabilityOut]
    date_overrides: List[DateOverrideOut]
    class Config:
        from_attributes = True

# ── Single-use links ───────────────────────────────────────────────────────────
class SingleUseLinkCreate(BaseModel):
    event_type_id: int
    title: Optional[str] = None
    duration: Optional[int] = None
    location: Optional[str] = None

class SingleUseLinkOut(BaseModel):
    id: int
    token: str
    event_type_id: int
    title: Optional[str]
    duration: Optional[int]
    location: Optional[str]
    is_used: bool
    used_at: Optional[datetime]
    created_at: datetime
    event_type: EventTypeOut
    class Config:
        from_attributes = True

# ── Bookings ───────────────────────────────────────────────────────────────────
class BookingCreate(BaseModel):
    invitee_name: str
    invitee_email: EmailStr
    start_time: datetime
    notes: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    invitee_name: str
    invitee_email: str
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str] = None
    event_type: EventTypeOut
    class Config:
        from_attributes = True

class SlotOut(BaseModel):
    start_time: datetime
    end_time: datetime
    available: bool