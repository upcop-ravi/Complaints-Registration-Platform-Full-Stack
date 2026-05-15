import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendOTP } from '../services/email';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

authRouter.post('/send-otp', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0 && existingUser[0].isVerified) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser.length > 0) {
      await db.update(users).set({ otp, otpExpiry }).where(eq(users.email, email));
    } else {
      await db.insert(users).values({ name, email, password: '', otp, otpExpiry });
    }

    await sendOTP(email, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

authRouter.post('/register', async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Email, OTP, and password are required' });
  }

  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult[0];
    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    await db.update(users).set({ password, isVerified: true, otp: null, otpExpiry: null }).where(eq(users.email, email));
    res.json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    if (userResult.length === 0 || !userResult[0].isVerified) {
      return res.status(400).json({ error: 'Invalid credentials or unverified account' });
    }

    const user = userResult[0];
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET!, { expiresIn: '1d' });
    
    // Cookie must not be HttpOnly, not Secure, not SameSite Strict (per requirements)
    res.cookie('token', token, { httpOnly: false, secure: false, sameSite: 'lax' });
    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

authRouter.get('/me', requireAuth, (req: any, res: any) => {
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role });
});
