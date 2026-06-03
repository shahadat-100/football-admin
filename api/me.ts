import { jwtVerify } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET_STRING = process.env.JWT_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!JWT_SECRET_STRING) {
    return res.status(500).json({ message: 'Internal server configuration error' });
  }
  
  const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
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
