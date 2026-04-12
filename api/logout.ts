import { serialize } from 'cookie';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ message: 'Logged out successfully' });
}
