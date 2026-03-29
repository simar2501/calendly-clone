from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import MeetingPoll, PollTimeSlot, PollVote, Booking, EventType
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import uuid
import os

router = APIRouter()
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", 1))


# ── Schemas ───────────────────────────────────────────────────────────────────

class SlotIn(BaseModel):
    start_time: datetime
    end_time: datetime

class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int = 30
    location: Optional[str] = None
    color: Optional[str] = "#006bff"
    time_slots: List[SlotIn]

class VoteIn(BaseModel):
    voter_name: str
    voter_email: EmailStr
    votes: List[dict]  # [{"slot_id": int, "available": bool}]

class ConfirmSlotIn(BaseModel):
    slot_id: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_poll(poll: MeetingPoll):
    slots = []
    for slot in sorted(poll.time_slots, key=lambda s: s.start_time):
        votes = [{"id": v.id, "voter_name": v.voter_name, "voter_email": v.voter_email, "available": v.available} for v in slot.votes]
        yes_count = sum(1 for v in slot.votes if v.available)
        slots.append({
            "id": slot.id,
            "start_time": slot.start_time.isoformat(),
            "end_time": slot.end_time.isoformat(),
            "votes": votes,
            "yes_count": yes_count,
        })

    # Collect unique voters across all slots
    seen = set()
    voters = []
    for slot in poll.time_slots:
        for v in slot.votes:
            if v.voter_email not in seen:
                seen.add(v.voter_email)
                voters.append({"name": v.voter_name, "email": v.voter_email})

    return {
        "id": poll.id,
        "token": poll.token,
        "title": poll.title,
        "description": poll.description,
        "duration": poll.duration,
        "location": poll.location,
        "color": poll.color,
        "status": poll.status,
        "confirmed_slot_id": poll.confirmed_slot_id,
        "created_at": poll.created_at.isoformat(),
        "time_slots": slots,
        "voters": voters,
        "total_voters": len(voters),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/")
def get_polls(db: Session = Depends(get_db)):
    polls = (
        db.query(MeetingPoll)
        .options(joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes))
        .filter(MeetingPoll.user_id == DEFAULT_USER_ID)
        .order_by(MeetingPoll.created_at.desc())
        .all()
    )
    return [serialize_poll(p) for p in polls]


@router.post("/")
def create_poll(data: PollCreate, db: Session = Depends(get_db)):
    poll = MeetingPoll(
        user_id=DEFAULT_USER_ID,
        token=str(uuid.uuid4()),
        title=data.title,
        description=data.description,
        duration=data.duration,
        location=data.location,
        color=data.color or "#006bff",
        status="open",
    )
    db.add(poll)
    db.flush()  # get poll.id

    for slot in data.time_slots:
        db.add(PollTimeSlot(poll_id=poll.id, start_time=slot.start_time, end_time=slot.end_time))

    db.commit()
    db.refresh(poll)

    # reload with relationships
    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.id == poll.id).first()
    return serialize_poll(poll)


@router.get("/vote/{token}")
def get_poll_for_voting(token: str, db: Session = Depends(get_db)):
    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.token == token).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return serialize_poll(poll)


@router.post("/vote/{token}")
def submit_vote(token: str, data: VoteIn, db: Session = Depends(get_db)):
    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.token == token).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "open":
        raise HTTPException(status_code=400, detail="This poll is no longer accepting votes")

    # Remove existing votes from this email
    slot_ids = [s.id for s in poll.time_slots]
    db.query(PollVote).filter(
        PollVote.slot_id.in_(slot_ids),
        PollVote.voter_email == data.voter_email
    ).delete(synchronize_session=False)

    # Add new votes
    for v in data.votes:
        slot = db.query(PollTimeSlot).filter(
            PollTimeSlot.id == v["slot_id"],
            PollTimeSlot.poll_id == poll.id
        ).first()
        if slot:
            db.add(PollVote(
                slot_id=v["slot_id"],
                voter_name=data.voter_name,
                voter_email=data.voter_email,
                available=v.get("available", True),
            ))

    db.commit()

    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.token == token).first()
    return serialize_poll(poll)


@router.post("/{poll_id}/confirm")
def confirm_slot(poll_id: int, data: ConfirmSlotIn, db: Session = Depends(get_db)):
    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.id == poll_id, MeetingPoll.user_id == DEFAULT_USER_ID).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    slot = db.query(PollTimeSlot).filter(
        PollTimeSlot.id == data.slot_id,
        PollTimeSlot.poll_id == poll_id
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Create bookings for all voters who said yes
    event = db.query(EventType).filter(
        EventType.user_id == DEFAULT_USER_ID
    ).first()

    yes_voters = [v for v in slot.votes if v.available]
    for voter in yes_voters:
        booking = Booking(
            event_type_id=event.id if event else None,
            invitee_name=voter.voter_name,
            invitee_email=voter.voter_email,
            start_time=slot.start_time,
            end_time=slot.end_time,
            status="confirmed",
            notes=f"[Meeting Poll: {poll.title}]",
        )
        db.add(booking)

    poll.confirmed_slot_id = data.slot_id
    poll.status = "confirmed"
    db.commit()

    poll = db.query(MeetingPoll).options(
        joinedload(MeetingPoll.time_slots).joinedload(PollTimeSlot.votes)
    ).filter(MeetingPoll.id == poll_id).first()
    return serialize_poll(poll)


@router.delete("/{poll_id}")
def delete_poll(poll_id: int, db: Session = Depends(get_db)):
    poll = db.query(MeetingPoll).filter(
        MeetingPoll.id == poll_id,
        MeetingPoll.user_id == DEFAULT_USER_ID
    ).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    db.delete(poll)
    db.commit()
    return {"message": "Deleted"}


@router.patch("/{poll_id}/close")
def close_poll(poll_id: int, db: Session = Depends(get_db)):
    poll = db.query(MeetingPoll).filter(
        MeetingPoll.id == poll_id,
        MeetingPoll.user_id == DEFAULT_USER_ID
    ).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.status = "closed"
    db.commit()
    return {"message": "Poll closed"}