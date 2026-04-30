# 🗺️ NearNow — Real-Time Live Event Map

NearNow is a full-stack real-time web application that lets users discover and post live events happening around them on an interactive map. Events appear instantly for all connected users via WebSocket — no page refresh needed.

## 🚀 Features

- 🗺️ **Interactive Map** — Drop event pins anywhere using Leaflet.js + OpenStreetMap
- ⚡ **Real-Time Updates** — New events broadcast instantly to all users via WebSocket (STOMP)
- 🔐 **User Authentication** — Register and login with BCrypt-encrypted passwords
- 📍 **Place Search** — Search any location using Photon geocoder (autocomplete)
- 🎯 **Category Filters** — Filter events by Music, Food, Sports, Meetup, Art, Other
- ⏱️ **Event Expiry** — Events auto-expire based on user-set date and time
- 🗑️ **Delete Events** — Remove events in real time across all connected clients
- 👥 **Live User Count** — See how many people are viewing the map right now
- 📋 **Events Dashboard** — Dedicated page with active and expired events in a table view
- 📱 **Responsive UI** — Resizable sidebar that adapts to all screen sizes

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 4, Spring Security 7 |
| Real-Time | WebSocket, STOMP Protocol |
| Database | MySQL 8, Spring Data JPA, Hibernate 7 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Map | Leaflet.js, OpenStreetMap, Photon Geocoder |
| Build Tool | Maven |

## 🏗️ Architecture

Browser (HTML + JS + Leaflet.js)
↕ REST API + WebSocket (STOMP)
Spring Boot Backend
├── EventController   → REST endpoints
├── WebSocketConfig   → STOMP broker
├── EventService      → Business logic
└── EventExpiryScheduler → Auto-expire events
↕ JPA / Hibernate
MySQL Database
├── events table
└── users table

## ⚙️ Getting Started

### Prerequisites
- Java 21+
- MySQL 8+
- Maven

### Setup

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/nearnow.git
cd nearnow
```

2. Create the database
```sql
CREATE DATABASE nearnow_db;
```

3. Configure your database credentials — copy the template and fill in your details:
```bash
cp src/main/resources/application-template.properties src/main/resources/application.properties
```

4. Run the application
```bash
mvn spring-boot:run
```

5. Open your browser at
   http://localhost:8080

### 📸 Pages

| Page | Description |
|---|---|
| `/` | Interactive live event map |
| `/events.html` | Events dashboard with active and expired tables |
| `/login.html` | User login |
| `/register.html` | User registration |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Get all active events |
| POST | `/api/events` | Create a new event |
| DELETE | `/api/events/{id}` | Delete an event |
| GET | `/api/events/all` | Get all events including expired |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/users/count` | Get live connected user count |

## 🌐 WebSocket Topics

| Topic | Description |
|---|---|
| `/topic/events` | New event broadcast |
| `/topic/expired` | Event expiry broadcast |
| `/topic/deleted` | Event deletion broadcast |
| `/topic/users` | Live user count updates |

## 👨‍💻 Author

Built with ❤️ using Spring Boot and real-time WebSocket technology.

---

⭐ If you found this project useful, give it a star!
