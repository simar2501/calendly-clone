from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import EventType
from ..schemas import EventTypeCreate, EventTypeUpdate, EventTypeOut
from typing import List
import os

router = APIRouter()
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", 1))

@router.get("", response_model=List[EventTypeOut])
def get_event_types(db: Session = Depends(get_db)):
    return db.query(EventType).filter(
        EventType.user_id == DEFAULT_USER_ID
    ).all()

@router.post("", response_model=EventTypeOut)
def create_event_type(data: EventTypeCreate, db: Session = Depends(get_db)):
    existing = db.query(EventType).filter(EventType.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    event = EventType(**data.dict(), user_id=DEFAULT_USER_ID)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/{event_id}", response_model=EventTypeOut)
def update_event_type(event_id: int, data: EventTypeUpdate, db: Session = Depends(get_db)):
    event = db.query(EventType).filter(EventType.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_event_type(event_id: int, db: Session = Depends(get_db)):
    event = db.query(EventType).filter(EventType.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event type not found")
    
    # Delete related records first to avoid foreign key constraint errors
    from ..models import Booking, SingleUseLink
    db.query(Booking).filter(Booking.event_type_id == event_id).delete()
    db.query(SingleUseLink).filter(SingleUseLink.event_type_id == event_id).delete()
    
    db.delete(event)
    db.commit()
    return {"message": "Deleted successfully"}