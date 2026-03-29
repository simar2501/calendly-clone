from .database import SessionLocal
from .models import User, EventType, Availability, Booking
from datetime import datetime, time, timedelta

def seed():
    db = SessionLocal()

    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, name="John Doe", email="john@example.com", timezone="UTC")
        db.add(user)
        db.commit()

    events = [
        EventType(user_id=1, title="30 Minute Meeting", duration=30, slug="30-min", color="#006bff", description="Quick sync call"),
        EventType(user_id=1, title="60 Minute Meeting", duration=60, slug="60-min", color="#1d3557", description="Deep dive session"),
        EventType(user_id=1, title="15 Minute Intro", duration=15, slug="15-min-intro", color="#e63946", description="Quick introduction"),
    ]
    for e in events:
        exists = db.query(EventType).filter(EventType.slug == e.slug).first()
        if not exists:
            db.add(e)
    db.commit()

    for day in range(5):
        exists = db.query(Availability).filter(
            Availability.user_id == 1, Availability.day_of_week == day
        ).first()
        if not exists:
            db.add(Availability(user_id=1, day_of_week=day, start_time=time(9, 0), end_time=time(17, 0), is_active=True))
    db.commit()

    event = db.query(EventType).filter(EventType.slug == "30-min").first()
    if event:
        sample_bookings = [
            Booking(event_type_id=event.id, invitee_name="Alice Smith", invitee_email="alice@example.com",
                    start_time=datetime.utcnow() + timedelta(days=1, hours=2),
                    end_time=datetime.utcnow() + timedelta(days=1, hours=2, minutes=30), status="confirmed"),
            Booking(event_type_id=event.id, invitee_name="Bob Johnson", invitee_email="bob@example.com",
                    start_time=datetime.utcnow() - timedelta(days=2),
                    end_time=datetime.utcnow() - timedelta(days=2) + timedelta(minutes=30), status="confirmed"),
        ]
        for b in sample_bookings:
            db.add(b)
        db.commit()

    db.close()
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    seed()