import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const allowedAdmins = [
  "jaysaner14@gmail.com",
  "omkarwaghmare737@gmail.com"
];

// Helper to authenticate token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
    req.user = user;
    next();
  });
};

// Login Route
app.post('/api/auth/login', async (req, res) => {
  console.log(`[API] Received POST /api/auth/login for email: ${req.body?.email}`);
  const { email, password } = req.body;

  if (!allowedAdmins.includes(email)) {
    return res.status(403).json({ message: 'Access Denied' });
  }

  // Assuming a single ADMIN_PASSWORD hash for simplicity, or hardcoded if env is missing
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  let isValid = false;

  if (adminPasswordHash) {
    isValid = await bcrypt.compare(password, adminPasswordHash);
  } else {
    // Fallback simple password for development if env is not set
    isValid = password === 'admin123';
  }

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '8h' });

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/'
  });

  res.json({ message: 'Logged in successfully', email });
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Verify Auth Route (used by frontend to check if logged in)
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

// Example of a protected API
app.get('/api/admin/data', authenticateToken, (req, res) => {
  res.json({ message: 'This is protected data' });
});

export default app;
