from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Availability, AvailabilityOverride
from ..schemas import AvailabilityUpdate, AvailabilityOut, DateOverrideOut, AvailabilityResponse
import os

router = APIRouter()
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", 1))


@router.get("", response_model=AvailabilityResponse)
def get_availability(db: Session = Depends(get_db)):
    # ── Weekly schedule ────────────────────────────────────────────────────────
    data = db.query(Availability).filter(
        Availability.user_id == DEFAULT_USER_ID
    ).order_by(Availability.day_of_week).all()

    if not data:
        default = []
        for i in range(7):
            av = Availability(
                user_id=DEFAULT_USER_ID,
                day_of_week=i,
                start_time="09:00",
                end_time="17:00",
                is_active=True if 1 <= i <= 5 else False
            )
            db.add(av)
            default.append(av)
        db.commit()
        for av in default:
            db.refresh(av)
        data = default

    # ── Date overrides ─────────────────────────────────────────────────────────
    overrides = db.query(AvailabilityOverride).filter(
        AvailabilityOverride.user_id == DEFAULT_USER_ID,
        AvailabilityOverride.is_unavailable == False
    ).order_by(AvailabilityOverride.date).all()

    return {"availability": data, "date_overrides": overrides}


@router.put("", response_model=AvailabilityResponse)
def update_availability(data: AvailabilityUpdate, db: Session = Depends(get_db)):
    # ── Save weekly schedule ───────────────────────────────────────────────────
    db.query(Availability).filter(
        Availability.user_id == DEFAULT_USER_ID
    ).delete()

    saved_schedule = []
    for item in data.availability:
        av = Availability(
            user_id=DEFAULT_USER_ID,
            day_of_week=item.day_of_week,
            start_time=item.start_time,
            end_time=item.end_time,
            is_active=item.is_active
        )
        db.add(av)
        saved_schedule.append(av)

    # ── Save date overrides ────────────────────────────────────────────────────
    db.query(AvailabilityOverride).filter(
        AvailabilityOverride.user_id == DEFAULT_USER_ID
    ).delete()

    saved_overrides = []
    for ov in (data.date_overrides or []):
        override = AvailabilityOverride(
            user_id=DEFAULT_USER_ID,
            date=ov.date,
            start_time=ov.start_time,
            end_time=ov.end_time,
            is_unavailable=False
        )
        db.add(override)
        saved_overrides.append(override)

    db.commit()

    for av in saved_schedule:
        db.refresh(av)
    for ov in saved_overrides:
        db.refresh(ov)

    return {"availability": saved_schedule, "date_overrides": saved_overrides}