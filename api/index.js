import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ── Supabase Client ──────────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[API] Supabase connected');
} else {
  console.warn('[API] WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not set. Database features disabled.');
}

// ── Allowed Admins ───────────────────────────────────────────────────────────
const allowedAdmins = [
  "jaysaner14@gmail.com",
  "omkarwaghmare737@gmail.com"
];

// ── Auth Middleware ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
    req.user = user;
    next();
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Login
app.post('/api/auth/login', async (req, res) => {
  console.log(`[API] POST /api/auth/login for email: ${req.body?.email}`);
  const { email, password } = req.body;

  if (!allowedAdmins.includes(email)) {
    return res.status(403).json({ message: 'Access Denied' });
  }

  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  let isValid = false;

  if (adminPasswordHash) {
    isValid = await bcrypt.compare(password, adminPasswordHash);
  } else {
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
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  });

  res.json({ message: 'Logged in successfully', email });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Verify
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

// ══════════════════════════════════════════════════════════════════════════════
// REGISTRATION / BADGE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// PUBLIC: Save a new registration (when user generates a badge)
app.post('/api/registrations', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Database not configured' });
  }

  try {
    const { id, name, photo, city, role, gender, date, isGroup, groupData } = req.body;

    const { data, error } = await supabase
      .from('registrations')
      .insert([{
        id,
        name,
        photo: photo || null,
        city: city || '',
        role: role || 'Attendee',
        gender: gender || 'female',
        date: date || new Date().toLocaleDateString(),
        is_group: isGroup || false,
        group_data: groupData || null
      }])
      .select();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      return res.status(500).json({ message: 'Failed to save registration', error: error.message });
    }

    res.status(201).json({ message: 'Registration saved', registration: data[0] });
  } catch (err) {
    console.error('[API] Registration save error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: Get all registrations
app.get('/api/registrations', authenticateToken, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Database not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Supabase fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch registrations', error: error.message });
    }

    // Map back to frontend expected format
    const registrations = data.map(r => ({
      id: r.id,
      name: r.name,
      photo: r.photo,
      city: r.city,
      role: r.role,
      gender: r.gender,
      date: r.date,
      isGroup: r.is_group,
      groupData: r.group_data
    }));

    res.json({ registrations });
  } catch (err) {
    console.error('[API] Registration fetch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ADMIN: Delete a registration
app.delete('/api/registrations/:id', authenticateToken, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Database not configured' });
  }

  try {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[API] Supabase delete error:', error);
      return res.status(500).json({ message: 'Failed to delete registration', error: error.message });
    }

    res.json({ message: 'Registration deleted' });
  } catch (err) {
    console.error('[API] Registration delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default app;
