from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import event_types, availability, bookings, meetings, contacts, SingleUseLink
from .routes import polls
from . import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Schedulr API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://calendly-clone-7d2t.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(event_types.router, prefix="/api/event-types", tags=["Event Types"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(bookings.router, prefix="/api/booking", tags=["Booking"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(SingleUseLink.router, prefix="/api/single-use-links", tags=["single-use-links"])
app.include_router(polls.router, prefix="/api/polls", tags=["Polls"])

@app.get("/")
def root():
    return {"message": "Schedulr API Running"}