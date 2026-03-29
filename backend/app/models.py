from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    timezone = Column(String, default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    event_types = relationship("EventType", back_populates="user")
    availability = relationship("Availability", back_populates="user")

class EventType(Base):
    __tablename__ = "event_types"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    color = Column(String, default="#006bff")
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_single_use = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="event_types")
    bookings = relationship("Booking", back_populates="event_type")
    single_use_links = relationship("SingleUseLink", back_populates="event_type")

class Availability(Base):
    __tablename__ = "availability"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True)
    user = relationship("User", back_populates="availability")

class AvailabilityOverride(Base):
    __tablename__ = "availability_overrides"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_unavailable = Column(Boolean, default=False)

class SingleUseLink(Base):
    __tablename__ = "single_use_links"
    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"))
    token = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    event_type = relationship("EventType", back_populates="single_use_links")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"))
    single_use_link_id = Column(Integer, ForeignKey("single_use_links.id"), nullable=True)
    invitee_name = Column(String, nullable=False)
    invitee_email = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String, default="confirmed")
    notes = Column(Text, nullable=True)
    cancel_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    event_type = relationship("EventType", back_populates="bookings")

# ── Meeting Polls ─────────────────────────────────────────────────────────────

class MeetingPoll(Base):
    __tablename__ = "meeting_polls"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration = Column(Integer, nullable=False, default=30)
    location = Column(String, nullable=True)
    color = Column(String, default="#006bff")
    status = Column(String, default="open")  # open | confirmed | closed
    confirmed_slot_id = Column(Integer, ForeignKey("poll_time_slots.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    time_slots = relationship("PollTimeSlot", back_populates="poll", foreign_keys="PollTimeSlot.poll_id", cascade="all, delete-orphan")
    confirmed_slot = relationship("PollTimeSlot", foreign_keys=[confirmed_slot_id])

class PollTimeSlot(Base):
    __tablename__ = "poll_time_slots"
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("meeting_polls.id"))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    poll = relationship("MeetingPoll", back_populates="time_slots", foreign_keys=[poll_id])
    votes = relationship("PollVote", back_populates="slot", cascade="all, delete-orphan")

class PollVote(Base):
    __tablename__ = "poll_votes"
    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("poll_time_slots.id"))
    voter_name = Column(String, nullable=False)
    voter_email = Column(String, nullable=False)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("PollTimeSlot", back_populates="votes")