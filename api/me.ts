import { jwtVerify } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@football.com';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-local-dev-change-this-now');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Return user info if token is valid
    return res.status(200).json({ 
      user: { 
        email: payload.email, 
        name: 'Admin User', 
        role: 'admin' 
      } 
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
