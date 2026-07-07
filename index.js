const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
const db = new Database(path.join(__dirname, 'data.db'));

// Create rooms table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roomNumber TEXT UNIQUE NOT NULL,
    roomType TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    guestName TEXT,
    guestPhone TEXT,
    checkInDate TEXT,
    checkOutDate TEXT
  )
`);

// Helper validation function
const validateRoomData = (data) => {
  const { roomNumber, roomType, price, status, guestPhone, checkInDate, checkOutDate } = data;
  
  if (!roomNumber || roomNumber.trim() === '') {
    return 'Room number is required.';
  }
  if (roomNumber.length > 10) {
    return 'Room number cannot exceed 10 characters.';
  }

  const allowedTypes = ['Single', 'Double', 'Deluxe', 'Suite'];
  if (!allowedTypes.includes(roomType)) {
    return 'Invalid room type.';
  }

  if (isNaN(price) || Number(price) <= 0) {
    return 'Price must be a positive number.';
  }

  const allowedStatus = ['Available', 'Booked', 'Occupied'];
  if (!allowedStatus.includes(status)) {
    return 'Invalid status.';
  }

  if (guestPhone && guestPhone.trim() !== '') {
    if (!/^\d{10}$/.test(guestPhone.trim())) {
      return 'Guest phone must contain exactly 10 digits.';
    }
  }

  if (checkInDate && checkOutDate) {
    if (new Date(checkOutDate) < new Date(checkInDate)) {
      return 'Check-out date cannot be before check-in date.';
    }
  }

  return null;
};

// --- REST APIs ---

// GET /rooms - Return all rooms
app.get('/rooms', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM rooms');
    const rooms = stmt.all();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /available - Return only available rooms
app.get('/available', (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM rooms WHERE status = 'Available'");
    const rooms = stmt.all();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /booked - Return booked and occupied rooms
app.get('/booked', (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM rooms WHERE status = 'Booked' OR status = 'Occupied'");
    const rooms = stmt.all();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /search - Search by room number
app.get('/search', (req, res) => {
  try {
    const { room } = req.query;
    if (!room) {
      return res.status(400).json({ error: 'Search query parameter "room" is required.' });
    }
    const stmt = db.prepare('SELECT * FROM rooms WHERE roomNumber LIKE ?');
    const rooms = stmt.all(`%${room}%`);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /rooms/:id - Return one room
app.get('/rooms/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM rooms WHERE id = ?');
    const room = stmt.get(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /rooms - Add a new room
app.post('/rooms', (req, res) => {
  try {
    const validationError = validateRoomData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { roomNumber, roomType, price, status, guestName, guestPhone, checkInDate, checkOutDate } = req.body;

    // Check uniqueness of room number
    const checkStmt = db.prepare('SELECT id FROM rooms WHERE roomNumber = ?');
    if (checkStmt.get(roomNumber)) {
      return res.status(400).json({ error: 'Room number already exists.' });
    }

    const stmt = db.prepare(`
      INSERT INTO rooms (roomNumber, roomType, price, status, guestName, guestPhone, checkInDate, checkOutDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      roomNumber,
      roomType,
      Number(price),
      status,
      guestName || null,
      guestPhone || null,
      checkInDate || null,
      checkOutDate || null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Room added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /rooms/:id - Update room information
app.put('/rooms/:id', (req, res) => {
  try {
    const validationError = validateRoomData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { roomNumber, roomType, price, status, guestName, guestPhone, checkInDate, checkOutDate } = req.body;
    const { id } = req.params;

    // Verify room exists
    const roomStmt = db.prepare('SELECT id FROM rooms WHERE id = ?');
    if (!roomStmt.get(id)) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    // Check uniqueness of room number excluding itself
    const checkStmt = db.prepare('SELECT id FROM rooms WHERE roomNumber = ? AND id != ?');
    if (checkStmt.get(roomNumber, id)) {
      return res.status(400).json({ error: 'Room number already in use by another room.' });
    }

    const stmt = db.prepare(`
      UPDATE rooms 
      SET roomNumber = ?, roomType = ?, price = ?, status = ?, guestName = ?, guestPhone = ?, checkInDate = ?, checkOutDate = ?
      WHERE id = ?
    `);

    stmt.run(
      roomNumber,
      roomType,
      Number(price),
      status,
      guestName || null,
      guestPhone || null,
      checkInDate || null,
      checkOutDate || null,
      id
    );

    res.json({ message: 'Room updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /rooms/:id - Delete room
app.delete('/rooms/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM rooms WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    
    res.json({ message: 'Room deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running smoothly on port ${PORT}`);
});