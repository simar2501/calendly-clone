# Schedulr — Calendly Clone

A full-stack scheduling application built as part of an internship evaluation. Schedulr replicates core Calendly features including event type management, availability configuration, one-on-one bookings, meeting polls, single-use links, and contact management.

---

## Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Validation:** Pydantic
- **Frontend:** React (Create React App)
- **Email:** SMTP (Gmail) via `smtplib`

---

## Features

- **Event Types** — Create, update, and manage meeting types with custom duration, color, slug, and location.
- **Availability** — Set weekly availability windows per day of the week; supports override dates for exceptions.
- **Bookings** — Invitees can book a slot via event slug. Includes conflict detection, buffer time logic (before/after meeting), and double-booking prevention per invitee email.
- **Single-Use Links** — Generate one-time booking links tied to an event type. A link is automatically marked as used after a booking is made through it.
- **Meeting Polls** — Create polls with multiple proposed time slots; invitees vote on their availability, and the host confirms a final slot.
- **Meetings** — View and manage scheduled meetings.
- **Contacts** — Manage a list of contacts.
- **Email Notifications** — Confirmation emails are sent to invitees upon booking via Gmail SMTP.
- **Auto-seeded Default User** — A default user (`John Doe`) is created on startup if none exists.

---

## Project Structure

```
backend/
├── main.py          # FastAPI app entry point, middleware, router registration
├── models.py        # SQLAlchemy ORM models
├── schemas.py       # Pydantic request/response schemas
├── database.py      # DB engine and session setup
├── seed.py          # Optional database seeding script
└── routes/
    ├── event_types.py
    ├── availability.py
    ├── bookings.py
    ├── meetings.py
    ├── contacts.py
    ├── SingleUseLink.py
    └── polls.py
```

---

## Database Models

- **`User`** — The host user (single-user system, ID=1 by default)
- **`EventType`** — A meeting type with title, duration, slug, color, etc.
- **`Availability`** — Weekly recurring availability windows
- **`AvailabilityOverride`** — Date-specific availability exceptions
- **`Booking`** — A confirmed meeting between host and invitee
- **`SingleUseLink`** — One-time booking tokens linked to an event type
- **`MeetingPoll`** — A group scheduling poll with proposed time slots
- **`PollTimeSlot`** — Individual time options within a poll
- **`PollVote`** — Invitee votes on poll slots

---

## API Endpoints

### Event Types — `/api/event-types`
- `GET /` — List all event types
- `POST /` — Create a new event type
- `PUT /{id}` — Update an event type
- `DELETE /{id}` — Delete an event type

### Availability — `/api/availability`
- `GET /` — Get availability schedule
- `POST /` — Set availability for a day
- `PUT /{id}` — Update an availability window

### Bookings — `/api/booking`
- `GET /{slug}` — Get event details by slug
- `GET /{slug}/slots` — Get available slots for a date
- `POST /{slug}` — Create a booking (supports `?token` query param for single-use links)

### Single-Use Links — `/api/single-use-links`
- `POST /` — Generate a single-use link
- `GET /{token}` — Validate/fetch a link

### Meeting Polls — `/api/polls`
- `POST /` — Create a new poll
- `GET /{token}` — Fetch a poll by token
- `POST /{token}/vote` — Submit votes on time slots
- `POST /{token}/confirm/{slot_id}` — Host confirms a slot

### Meetings — `/api/meetings`
### Contacts — `/api/contacts`

---

## Setup & Installation

### Prerequisites
- Python 3.9+
- PostgreSQL
- Node.js & npm (for frontend)

### Backend

```bash
# Clone the repo
git clone <repo-url>
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create a .env file)
DATABASE_URL=postgresql://user:password@localhost/schedulr
DEFAULT_USER_ID=1

# Run the server
uvicorn main:app --reload
```

> API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

> App available at: `http://localhost:3000`

---

## Environment Variables

- **`DATABASE_URL`** — PostgreSQL connection string
- **`DEFAULT_USER_ID`** — The default host user ID (default: 1)

> **Note:** Email credentials in `bookings.py` (`sender` / `password`) should be moved to environment variables before production use.

---

## Key Design Decisions

- **Single-user system:** The app is designed around one host (user ID=1), matching the intern-phase scope of the project.
- **Buffer time:** Bookings support configurable buffer windows before and after each meeting to avoid back-to-back scheduling.
- **Conflict detection:** Both slot-level and per-invitee email conflict checks are enforced at booking time.
- **Single-use links:** Tokens are UUID-based and are atomically marked as used post-booking to prevent double-booking.
- **Meeting Polls:** Modeled separately from bookings — polls go through a vote → confirm lifecycle before becoming a confirmed meeting.
