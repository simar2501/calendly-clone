Schedulr | Full-Stack Calendly Clone
Schedulr is a high-performance scheduling platform designed to replicate the seamless booking experience of Calendly. This project was developed as part of the Phase 2 SDE Intern Evaluation, focusing on modular architecture, robust database design, and a pixel-perfect UI.

🚀 Live Demo & Repository
Deployment: [Link to Vercel/Render/Railway]

GitHub: [Link to your Repository]

🛠 Tech Stack
Frontend
Framework: React.js (Vite)

Styling: Tailwind CSS (Custom Design System)

State & Routing: React Router Dom v6

Icons: Lucide React

Date Handling: Day.js (with UTC & Timezone plugins)

Backend
Runtime: Node.js with Express.js

ORM: Sequelize (PostgreSQL)

Emailing: Nodemailer (SMTP Integration)

Validation: Logic-based conflict checking for double-booking prevention.

✨ Core Features
1. Event Type Management (Admin)
Dynamic Dashboard: A grid-based view of all active event types with color-coded categories.

CRUD Operations: Create, edit, and delete event types (Duration, Slug, Location, and Color).

Quick Actions: "Copy Link" functionality and direct preview of the public booking page.

2. Availability Engine
Weekly Logic: Set recurring "Working Hours" for each day of the week.

Timezone Aware: Global scheduling support using Asia/Kolkata as the default.

Date-Specific Overrides: (Feature implemented) Add specific slots or mark yourself unavailable for specific calendar dates.

3. Public Booking Flow (UX-Focused)
Two-Column Layout: Matches Calendly’s signature split-view (Event details on the left, interactive calendar on the right).

Smart Slots: Dynamically calculates available time slots based on the host's availability and existing meetings.

Double-Booking Protection: Real-time backend validation ensures no two meetings can overlap in the same event type.

4. Meeting Management
Tabs: View "Upcoming" and "Past" meetings.

Cancelation: Ability to cancel meetings with an automated email notification sent to the invitee.

📂 Database Schema Design
The system uses a relational PostgreSQL schema managed via Sequelize:

User: Stores admin profile and global settings.

EventType: Linked to User (1:N). Stores configuration for meeting types (e.g., "15 Min Chat").

Availability: Linked to User (1:1). Stores a JSONB blob of weeklyHours for high flexibility.

Meeting: Linked to EventType (1:N). Stores invitee data and startTime/endTime timestamps.

⚙️ Installation & Setup
Prerequisites
Node.js (v18+)

PostgreSQL

Backend Setup
Navigate to /backend

Create a .env file:

Code snippet
PORT=5000
DB_NAME=schedulr
DB_USER=postgres
DB_PASSWORD=your_password
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
Install dependencies and start:

Bash
npm install
npm run dev
Frontend Setup
Navigate to /frontend

Install dependencies and start:

Bash
npm install
npm run dev
🧠 Technical Decisions & Assumptions
No Auth Assumption: Per assignment requirements, a default admin user is automatically injected into the request context via middleware (app.use) to simplify the evaluation of the booking flow.

Atomic CSS: Used Tailwind CSS to ensure the UI remains lightweight and matches Calendly's exact padding, border-radius (2xl), and color palette (#0069ff).

Conflict Logic: The backend utilizes Sequelize operators (Op.lt, Op.gt) to perform range-overlap checks during the booking process to ensure 100% data integrity.
