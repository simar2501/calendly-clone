from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EventType, Booking, Availability, SingleUseLink
from ..schemas import BookingCreate, BookingOut, SlotOut
from datetime import datetime, timedelta, date
from typing import List
import os

import smtplib
from email.mime.text import MIMEText

router = APIRouter()
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", 1))


def send_email(to_email, subject, body):
    sender = "your_email@gmail.com"
    password = "your_app_password"
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)
    except:
        pass


@router.get("/{slug}")
def get_event_by_slug(slug: str, db: Session = Depends(get_db)):
    event = db.query(EventType).filter(
        EventType.slug == slug,
        EventType.is_active == True
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{slug}/slots", response_model=List[SlotOut])
def get_available_slots(slug: str, date_str: str, db: Session = Depends(get_db)):
    event = db.query(EventType).filter(EventType.slug == slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    selected_date = date.fromisoformat(date_str)
    day_of_week = (selected_date.weekday() + 1) % 7

    av = db.query(Availability).filter(
        Availability.user_id == DEFAULT_USER_ID,
        Availability.day_of_week == day_of_week,
        Availability.is_active == True
    ).first()

    if not av:
        return []

    slots = []
    start_h, start_m = map(int, str(av.start_time)[:5].split(':'))
    end_h, end_m = map(int, str(av.end_time)[:5].split(':'))

    current = datetime.combine(selected_date, datetime.min.time().replace(hour=start_h, minute=start_m))
    end_dt = datetime.combine(selected_date, datetime.min.time().replace(hour=end_h, minute=end_m))

    while current + timedelta(minutes=event.duration) <= end_dt:
        slot_end = current + timedelta(minutes=event.duration)
        conflict = db.query(Booking).filter(
            Booking.event_type_id == event.id,
            Booking.status == "confirmed",
            Booking.start_time < slot_end,
            Booking.end_time > current
        ).first()
        slots.append(SlotOut(start_time=current, end_time=slot_end, available=conflict is None))
        current += timedelta(minutes=event.duration)

    return slots


@router.post("/{slug}", response_model=BookingOut)
def create_booking(slug: str, data: BookingCreate, db: Session = Depends(get_db),
                   token: str = None):
    """
    Create a booking. Pass ?token=<uuid> in the query string when booking
    via a single-use link — the link will be marked used after booking.
    """
    event = db.query(EventType).filter(EventType.slug == slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # ── Single-use link validation ─────────────────────────────────────────────
    single_use_link = None
    if token:
        single_use_link = db.query(SingleUseLink).filter(
            SingleUseLink.token == token
        ).first()
        if not single_use_link:
            raise HTTPException(status_code=404, detail="Single-use link not found")
        if single_use_link.is_used:
            raise HTTPException(status_code=410, detail="This link has already been used")

    # ── Legacy is_single_use flag on event type ────────────────────────────────
    elif event.is_single_use:
        used = db.query(Booking).filter(
            Booking.event_type_id == event.id,
            Booking.status == "confirmed"
        ).first()
        if used:
            raise HTTPException(status_code=400, detail="This single-use link has already been used")

    # ── Buffer logic ───────────────────────────────────────────────────────────
    buffer_before = getattr(event, "buffer_before", 0) or 0
    buffer_after = getattr(event, "buffer_after", 0) or 0
    start_time = data.start_time - timedelta(minutes=buffer_before)
    end_time = data.start_time + timedelta(minutes=event.duration + buffer_after)

    # ── Conflict check ─────────────────────────────────────────────────────────
    conflict = db.query(Booking).filter(
        Booking.event_type_id == event.id,
        Booking.status == "confirmed",
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="This time slot is already booked. Please choose another.")

    email_conflict = db.query(Booking).join(EventType).filter(
        Booking.invitee_email == data.invitee_email,
        Booking.status == "confirmed",
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).first()
    if email_conflict:
        raise HTTPException(status_code=400, detail="You already have a booking during this time.")

    # ── Create booking ─────────────────────────────────────────────────────────
    booking = Booking(
        event_type_id=event.id,
        single_use_link_id=single_use_link.id if single_use_link else None,
        invitee_name=data.invitee_name,
        invitee_email=data.invitee_email,
        start_time=start_time,
        end_time=end_time,
        notes=data.notes if hasattr(data, "notes") else None,
    )
    db.add(booking)

    # ── Mark single-use link as used ───────────────────────────────────────────
    if single_use_link:
        single_use_link.is_used = True
        single_use_link.used_at = datetime.utcnow()

    db.commit()
    db.refresh(booking)

    send_email(
        booking.invitee_email,
        "Meeting Confirmed",
        f"Your meeting is scheduled from {booking.start_time} to {booking.end_time}"
    )

    return booking