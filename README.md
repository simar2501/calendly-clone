Schedulr \u2014 Calendly Clone
A full-stack scheduling application built as part of an internship evaluation. Schedulr replicates core Calendly features including event type management, availability configuration, one-on-one bookings, meeting polls, single-use links, and contact management.
Tech Stack
Backend: FastAPI (Python)
Database: PostgreSQL (via SQLAlchemy ORM)
Validation: Pydantic
Frontend: React (Create React App)
Email: SMTP (Gmail) via smtplib
Features
Event Types \u2014 Create, update, and manage meeting types with custom duration, color, slug, and location.
Availability \u2014 Set weekly availability windows per day of the week; supports override dates for exceptions.
Bookings \u2014 Invitees can book a slot via event slug. Includes conflict detection, buffer time logic (before/after meeting), and double-booking prevention per invitee email.
Single-Use Links \u2014 Generate one-time booking links tied to an event type. A link is automatically marked as used after a booking is made through it.
Meeting Polls \u2014 Create polls with multiple proposed time slots; invitees vote on their availability, and the host confirms a final slot.
Meetings \u2014 View and manage scheduled meetings.
Contacts \u2014 Manage a list of contacts.
Email Notifications \u2014 Confirmation emails are sent to invitees upon booking via Gmail SMTP.
Auto-seeded Default User \u2014 A default user (John Doe) is created on startup if none exists.
Project Structure
backend/
\u251c\u2500\u2500 main.py          # FastAPI app entry point, middleware, router registration
\u251c\u2500\u2500 models.py        # SQLAlchemy ORM models
\u251c\u2500\u2500 schemas.py       # Pydantic request/response schemas
\u251c\u2500\u2500 database.py      # DB engine and session setup
\u251c\u2500\u2500 seed.py          # Optional database seeding script
\u2514\u2500\u2500 routes/
    \u251c\u2500\u2500 event_types.py
    \u251c\u2500\u2500 availability.py
    \u251c\u2500\u2500 bookings.py
    \u251c\u2500\u2500 meetings.py
    \u251c\u2500\u2500 contacts.py
    \u251c\u2500\u2500 SingleUseLink.py
    \u2514\u2500\u2500 polls.py
Database Models
User \u2014 The host user (single-user system, ID=1 by default)
EventType \u2014 A meeting type with title, duration, slug, color, etc.
Availability \u2014 Weekly recurring availability windows
AvailabilityOverride \u2014 Date-specific availability exceptions
Booking \u2014 A confirmed meeting between host and invitee
SingleUseLink \u2014 One-time booking tokens linked to an event type
MeetingPoll \u2014 A group scheduling poll with proposed time slots
PollTimeSlot \u2014 Individual time options within a poll
PollVote \u2014 Invitee votes on poll slots
API Endpoints
Event Types \u2014 /api/event-types
GET / \u2014 List all event types
POST / \u2014 Create a new event type
PUT /{id} \u2014 Update an event type
DELETE /{id} \u2014 Delete an event type
Availability \u2014 /api/availability
GET / \u2014 Get availability schedule
POST / \u2014 Set availability for a day
PUT /{id} \u2014 Update an availability window
Bookings \u2014 /api/booking
GET /{slug} \u2014 Get event details by slug
GET /{slug}/slots \u2014 Get available slots for a date
POST /{slug} \u2014 Create a booking (supports ?token query param for single-use links)
Single-Use Links \u2014 /api/single-use-links
POST / \u2014 Generate a single-use link
GET /{token} \u2014 Validate/fetch a link
Meeting Polls \u2014 /api/polls
POST / \u2014 Create a new poll
GET /{token} \u2014 Fetch a poll by token
POST /{token}/vote \u2014 Submit votes on time slots
POST /{token}/confirm/{slot_id} \u2014 Host confirms a slot
Meetings \u2014 /api/meetings
Contacts \u2014 /api/contacts
Setup & Installation
Prerequisites
Python 3.9+
PostgreSQL
Node.js & npm (for frontend)
Backend
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
API docs available at: http://localhost:8000/docs
Frontend
cd frontend
npm install
npm start
App available at: http://localhost:3000
Environment Variables
DATABASE_URL \u2014 PostgreSQL connection string
DEFAULT_USER_ID \u2014 The default host user ID (default: 1)
Note: Email credentials in bookings.py (sender / password) should be
