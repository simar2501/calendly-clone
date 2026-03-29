from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Booking
from typing import List

router = APIRouter()

@router.get("/")
def get_contacts(db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(
        Booking.status == "confirmed"
    ).all()

    # Group by email
    contacts = {}
    for booking in bookings:
        email = booking.invitee_email
        if email not in contacts:
            contacts[email] = {
                "name": booking.invitee_name,
                "email": booking.invitee_email,
                "last_meeting": None,
                "next_meeting": None,
            }
        from datetime import datetime
        if booking.start_time < datetime.utcnow():
            if not contacts[email]["last_meeting"] or booking.start_time > contacts[email]["last_meeting"]:
                contacts[email]["last_meeting"] = booking.start_time
        else:
            if not contacts[email]["next_meeting"] or booking.start_time < contacts[email]["next_meeting"]:
                contacts[email]["next_meeting"] = booking.start_time

    return list(contacts.values())