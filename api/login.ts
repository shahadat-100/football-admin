import { SignJWT } from 'jose';
import bcrpyt from 'bcryptjs';
import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET_STRING = process.env.JWT_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !JWT_SECRET_STRING) {
    console.error('Missing required environment variables for authentication.');
    return res.status(500).json({ message: 'Internal server configuration error' });
  }
  
  const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

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
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  const cookie = serialize('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
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
