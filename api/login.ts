import { SignJWT } from 'jose';
import bcrpyt from 'bcryptjs';
import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@football.com';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$MInQ15ItItf6zBXXtPI3vO5/EwbWPV2OCxKU5PMFuR08SJbMOwD9a';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-local-dev-change-this-now');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrpyt.compare(password, ADMIN_PASSWORD_HASH);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookie = serialize('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ 
    user: { 
      email: ADMIN_EMAIL, 
      name: 'Admin User', 
      role: 'admin' 
    } 
  });
}
