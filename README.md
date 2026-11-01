# IMovies – Movie Ticket Booking Made Simple

A full-stack MERN application (MongoDB, Express, React, Node.js) for browsing movies,
picking showtimes, choosing seats on a seat map and booking tickets, with an admin panel.

## Features

**Users**
- Register / login (JWT, passwords hashed with bcrypt)
- Browse and search movies, filter by genre and language
- Movie page with showtimes grouped by day and theatre, with seats-left count
- Interactive seat map (available / selected / booked), up to 8 seats per booking
- Booking confirmation, "My Tickets" page, cancel before the show starts

**Admin**
- Dashboard: movies, upcoming shows, tickets sold, revenue
- Add / edit / delete movies
- Add / delete shows (theatre, screen, time, price, seat layout)
- View all bookings and cancel any of them

## Tech stack
- **Frontend:** React 18, Vite, React Router, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Auth:** JSON Web Tokens with role-based access (user / admin)

## Project structure
```
imovies/
├── server/
│   ├── models/        User, Movie, Show, Booking
│   ├── routes/        auth, movies, shows, bookings, admin
│   ├── middleware/    auth (protect, adminOnly), error handling
│   ├── seed.js        sample movies, shows and demo accounts
│   └── server.js
└── client/src/
    ├── pages/         Home, MovieDetail, SeatSelection, Login, Register, MyBookings, Admin
    ├── components/    Navbar, MovieCard, Poster, ProtectedRoute
    ├── AuthContext.jsx
    └── api.js
```

## Getting started

Requirements: Node.js 18+ and MongoDB (local, or a MongoDB Atlas connection string).

### 1. Backend
```bash
cd server
npm install
cp .env.example .env     # edit JWT_SECRET (and MONGO_URI if needed)
npm run seed             # sample movies, shows (next 5 days) and demo accounts
npm run dev              # API on http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev              # app on http://localhost:5173
```
Vite proxies `/api` to the backend, so no extra config is needed.

### Demo accounts (from `npm run seed`)
| Role  | Email              | Password |
|-------|--------------------|----------|
| Admin | admin@imovies.com  | admin123 |
| User  | user@imovies.com   | user123  |

Re-run `npm run seed` any time to reset the data and generate fresh showtimes for the coming days.

## API overview

| Method | Endpoint                  | Access | Description |
|--------|---------------------------|--------|-------------|
| POST   | /api/auth/register        | Public | Create account |
| POST   | /api/auth/login           | Public | Login, returns JWT |
| GET    | /api/auth/me              | User   | Current user |
| GET    | /api/movies               | Public | List movies (search, genre, language) |
| GET    | /api/movies/:id           | Public | Movie details |
| POST/PUT/DELETE | /api/movies[/:id] | Admin | Manage movies |
| GET    | /api/shows?movie=<id>     | Public | Upcoming shows |
| GET    | /api/shows/:id            | Public | One show with booked seats |
| GET    | /api/shows/all            | Admin  | All shows incl. past |
| POST/DELETE | /api/shows[/:id]     | Admin  | Manage shows |
| POST   | /api/bookings             | User   | Book seats `{ showId, seats: ["A1","A2"] }` |
| GET    | /api/bookings/mine        | User   | My bookings |
| PUT    | /api/bookings/:id/cancel  | User   | Cancel (owner, or admin) |
| GET    | /api/admin/stats          | Admin  | Dashboard numbers |
| GET    | /api/admin/bookings       | Admin  | Latest 200 bookings |

## How double-booking is prevented
Each show stores its `bookedSeats`. A booking runs one atomic MongoDB update that only succeeds if
none of the requested seats are already in that array, so two people clicking the same seat at the
same moment can never both get it; the loser gets a "seats were just taken" message and a refreshed
seat map. Cancelling removes the seats from the array again.

## Notes
- The seeded movies are fictional and use generated gradient posters. Add a poster image URL in the
  admin panel to show a real image.
- Payments are not included; bookings are confirmed immediately.

## Ideas to extend
- Payment gateway (Razorpay / Stripe) with a short seat-hold timer
- Email or SMS ticket confirmation with a QR code
- Different price tiers per row (Silver / Gold / Recliner)
- Reviews and ratings, city selection
- Deploy: backend on Render, frontend on Vercel/Netlify, database on MongoDB Atlas
