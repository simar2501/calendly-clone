from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SingleUseLink, EventType, Booking, Availability
from ..schemas import SingleUseLinkCreate, SingleUseLinkOut, BookingCreate, BookingOut
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import os

router = APIRouter()
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", 1))


@router.get("/", response_model=List[SingleUseLinkOut])
def get_single_use_links(db: Session = Depends(get_db)):
    links = (
        db.query(SingleUseLink)
        .join(EventType)
        .filter(EventType.user_id == DEFAULT_USER_ID)
        .order_by(SingleUseLink.created_at.desc())
        .all()
    )
    return links


@router.post("/", response_model=SingleUseLinkOut)
def create_single_use_link(data: SingleUseLinkCreate, db: Session = Depends(get_db)):
    event = db.query(EventType).filter(
        EventType.id == data.event_type_id,
        EventType.user_id == DEFAULT_USER_ID
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")

    link = SingleUseLink(
        event_type_id=data.event_type_id,
        token=str(uuid.uuid4()),
        title=data.title,
        duration=data.duration,
        location=data.location,
        is_used=False,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{link_id}")
def delete_single_use_link(link_id: int, db: Session = Depends(get_db)):
    link = db.query(SingleUseLink).join(EventType).filter(
        SingleUseLink.id == link_id,
        EventType.user_id == DEFAULT_USER_ID
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.commit()
    return {"message": "Deleted"}


@router.get("/book/{token}")
def get_link_by_token(token: str, db: Session = Depends(get_db)):
    """Resolve token → event details for the booking page."""
    link = db.query(SingleUseLink).filter(SingleUseLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.is_used:
        raise HTTPException(status_code=410, detail="This link has already been used")

    event = link.event_type
    return {
        "token": link.token,
        "link_id": link.id,
        "event_type_id": event.id,
        "slug": event.slug,
        "title": link.title or event.title,
        "duration": link.duration or event.duration,
        "location": link.location or event.location,
        "color": event.color,
        "description": event.description,
    }


@router.get("/book/{token}/slots")
def get_slots_for_token(token: str, date_str: str, db: Session = Depends(get_db)):
    """Return available time slots for a given date."""
    link = db.query(SingleUseLink).filter(SingleUseLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.is_used:
        raise HTTPException(status_code=410, detail="This link has already been used")

    event = link.event_type
    duration = link.duration or event.duration

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    # day_of_week: Sun=0, Mon=1 ... Sat=6 (matching your DB)
    day_of_week = target_date.weekday() + 1
    if day_of_week == 7:
        day_of_week = 0

    avail = db.query(Availability).filter(
        Availability.user_id == DEFAULT_USER_ID,
        Availability.day_of_week == day_of_week,
        Availability.is_active == True
    ).first()

    if not avail:
        return []

    start_dt = target_date.replace(hour=avail.start_time.hour, minute=avail.start_time.minute, second=0)
    end_dt = target_date.replace(hour=avail.end_time.hour, minute=avail.end_time.minute, second=0)

    # Existing bookings that day
    day_start = target_date.replace(hour=0, minute=0, second=0)
    day_end = target_date.replace(hour=23, minute=59, second=59)
    existing = db.query(Booking).filter(
        Booking.start_time >= day_start,
        Booking.start_time <= day_end,
        Booking.status == "confirmed"
    ).all()
    booked = [(b.start_time, b.end_time) for b in existing]

    slots = []
    now = datetime.utcnow()
    current = start_dt
    while current + timedelta(minutes=duration) <= end_dt:
        slot_end = current + timedelta(minutes=duration)
        if current > now:
            conflict = any(not (slot_end <= bs or current >= be) for bs, be in booked)
            slots.append({
                "start_time": current.isoformat(),
                "end_time": slot_end.isoformat(),
                "available": not conflict,
            })
        current += timedelta(minutes=duration)

    return slots


class SingleUseBookingCreate(BaseModel):
    invitee_name: str
    invitee_email: EmailStr
    start_time: datetime
    notes: Optional[str] = None


@router.post("/book/{token}")
def book_single_use_link(token: str, data: SingleUseBookingCreate, db: Session = Depends(get_db)):
    """Book a meeting via a single-use link. Marks link as used after booking."""
    link = db.query(SingleUseLink).filter(SingleUseLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    if link.is_used:
        raise HTTPException(status_code=410, detail="This link has already been used")

    event = link.event_type
    duration = link.duration or event.duration

    booking = Booking(
        event_type_id=event.id,
        single_use_link_id=link.id,
        invitee_name=data.invitee_name,
        invitee_email=data.invitee_email,
        start_time=data.start_time,
        end_time=data.start_time + timedelta(minutes=duration),
        status="confirmed",
        notes=data.notes,
    )
    db.add(booking)

    # Mark link as used
    link.is_used = True
    link.used_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)

    return {
        "id": booking.id,
        "invitee_name": booking.invitee_name,
        "invitee_email": booking.invitee_email,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "status": booking.status,
        "event_type": {
            "title": link.title or event.title,
            "duration": duration,
            "color": event.color,
            "location": link.location or event.location,
        }
    }