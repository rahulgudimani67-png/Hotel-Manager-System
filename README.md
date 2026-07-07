# Dependencies
node_modules/
.pnp
.pnp.js

# Production / Builds
dist/
build/

# Local databases and logs
backend/server/data.db
*.log

# IDE and OS files
.DS_Store
.vscode/
.idea/
# Dependencies
node_modules/
.pnp
.pnp.js

# Production / Builds
dist/
build/

# Local databases and logs
backend/server/data.db
*.log

# IDE and OS files
.DS_Store
.vscode/
.idea/
# 🏨 Premium Hotel Management System Dashboard

A modern, full-stack Hotel Management System built with a luxury **React (Vite)** frontend and a lightweight **Node.js (Express) + SQLite3** backend. This system features a glassmorphism UI, a real-time statistics pipeline, and native server-side validation.

---

## ✨ Features

* **Premium Glassmorphic UI:** Smooth animated gradients, soft drop shadows, and glowing responsive tables.
* **Real-time Analytics:** Automated state metrics tracking Total Rooms, Available, Booked, and Occupied counts.
* **Robust Backend Engine:** Instant transactions driven by a high-performance `better-sqlite3` native database.
* **Dual-layer Validation:** Strict schema constraint matching on both UI inputs and API endpoints (e.g., negative price caps, 10-digit phone checks, chronologically accurate booking intervals).
* **Dynamic Filtering:** Instant search filtering by room numbers alongside rapid filter buttons for target status classes.

---

## 🛠️ Tech Stack

**Frontend:**
* React 18+ (Hooks, Functional Architecture)
* Vite (Build Tool)
* Vanilla CSS3 (Custom Variables, CSS Flexbox/Grid, Responsive Media Breakpoints)

**Backend:**
* Node.js & Express
* better-sqlite3 (Synchronous & highly optimized SQLite driver)
* CORS Middleware

---

## 🚀 Getting Started

Follow these steps to deploy and run the workspace locally on your computer.

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/hotel-management-system.git](https://github.com/YOUR_USERNAME/hotel-management-system.git)
cd hotel-management-system
