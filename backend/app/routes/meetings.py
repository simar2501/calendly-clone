from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Booking, Availability
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


def serialize_meeting(m):
    return {
        "id": m.id,
        "event_type": {
            "title": m.event_type.title if m.event_type else "",
            "color": m.event_type.color if m.event_type else "#006bff",
            "duration": m.event_type.duration if m.event_type else 30,
            "slug": m.event_type.slug if m.event_type else "",
        },
        "invitee_name": m.invitee_name,
        "invitee_email": m.invitee_email,
        "start_time": m.start_time,
        "end_time": m.end_time,
        "status": m.status,
        "notes": m.notes,
    }


@router.get("/")
def get_all_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Booking).options(joinedload(Booking.event_type)).all()
    return [serialize_meeting(m) for m in meetings]


@router.get("/upcoming")
def get_upcoming(db: Session = Depends(get_db)):
    meetings = db.query(Booking)\
        .options(joinedload(Booking.event_type))\
        .filter(
            Booking.start_time >= datetime.utcnow(),
            Booking.status == "confirmed"
        )\
        .order_by(Booking.start_time)\
        .all()
    return [serialize_meeting(m) for m in meetings]


@router.get("/past")
def get_past(db: Session = Depends(get_db)):
    meetings = db.query(Booking)\
        .options(joinedload(Booking.event_type))\
        .filter(Booking.start_time < datetime.utcnow())\
        .order_by(Booking.start_time.desc())\
        .all()
    return [serialize_meeting(m) for m in meetings]


@router.put("/{booking_id}/cancel")
def cancel_meeting(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    db.commit()
    return {"message": "Meeting cancelled"}


class RescheduleRequest(BaseModel):
    new_start_time: datetime
    reason: Optional[str] = None


@router.patch("/{booking_id}/reschedule")
def reschedule_meeting(booking_id: int, data: RescheduleRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).options(joinedload(Booking.event_type)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled meeting")

    duration = booking.event_type.duration if booking.event_type else 30
    booking.start_time = data.new_start_time
    booking.end_time = data.new_start_time + timedelta(minutes=duration)
    booking.status = "confirmed"
    if data.reason:
        booking.notes = f"[Rescheduled: {data.reason}]\n{booking.notes or ''}"
    db.commit()
    db.refresh(booking)
    return serialize_meeting(booking)


@router.get("/{booking_id}/slots")
def get_available_slots(booking_id: int, date: str, db: Session = Depends(get_db)):
    """Return available 30-min slots for a given date (YYYY-MM-DD)"""
    booking = db.query(Booking).options(joinedload(Booking.event_type)).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    day_of_week = target_date.weekday() + 1  # Python: Mon=0, our DB: Mon=1
    if day_of_week == 7:
        day_of_week = 0  # Sunday

    avail = db.query(Availability).filter(
        Availability.day_of_week == day_of_week,
        Availability.is_active == True
    ).first()

    if not avail:
        return {"slots": []}

    duration = booking.event_type.duration if booking.event_type else 30

    # Build slots
    start_dt = target_date.replace(
        hour=avail.start_time.hour,
        minute=avail.start_time.minute,
        second=0
    )
    end_dt = target_date.replace(
        hour=avail.end_time.hour,
        minute=avail.end_time.minute,
        second=0
    )

    # Get existing bookings on this day
    day_start = target_date.replace(hour=0, minute=0, second=0)
    day_end = target_date.replace(hour=23, minute=59, second=59)
    existing = db.query(Booking).filter(
        Booking.start_time >= day_start,
        Booking.start_time <= day_end,
        Booking.status == "confirmed",
        Booking.id != booking_id
    ).all()
    booked_times = [(b.start_time, b.end_time) for b in existing]

    slots = []
    current = start_dt
    now = datetime.utcnow()
    while current + timedelta(minutes=duration) <= end_dt:
        slot_end = current + timedelta(minutes=duration)
        # Skip past slots
        if current > now:
            conflict = any(
                not (slot_end <= bs or current >= be)
                for bs, be in booked_times
            )
            if not conflict:
                slots.append({
                    "start": current.isoformat(),
                    "end": slot_end.isoformat(),
                })
        current += timedelta(minutes=duration)

    return {"slots": slots}


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total = db.query(Booking).count()
    upcoming = db.query(Booking).filter(
        Booking.start_time >= datetime.utcnow(),
        Booking.status == "confirmed"
    ).count()
    return {"total_meetings": total, "upcoming_meetings": upcoming}