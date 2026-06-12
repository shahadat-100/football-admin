import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import bcrypt from 'bcryptjs'

// Simple local API mock for dev mode
const ADMIN_EMAIL = 'admin@football.com';
const ADMIN_PASSWORD_HASH = '$2b$10$MInQ15ItItf6zBXXtPI3vO5/EwbWPV2OCxKU5PMFuR08SJbMOwD9a'; // password123

let devLoggedInUser: any = null;

function apiMockPlugin() {
  return {
    name: 'api-mock',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        res.setHeader('Content-Type', 'application/json');

        // /api/login
        if (req.url === '/api/login' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const { email, password } = JSON.parse(body);
              if (email === ADMIN_EMAIL && await bcrypt.compare(password, ADMIN_PASSWORD_HASH)) {
                devLoggedInUser = { email: ADMIN_EMAIL, name: 'Admin User', role: 'admin' };
                res.end(JSON.stringify({ 
                  user: devLoggedInUser 
                }));
              } else {
                res.statusCode = 401;
                res.end(JSON.stringify({ message: 'Invalid credentials' }));
              }
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ message: 'Bad request' }));
            }
          });
          return;
        }

        // /api/logout
        if (req.url === '/api/logout') {
          devLoggedInUser = null;
          res.end(JSON.stringify({ message: 'Logged out' }));
          return;
        }

        // /api/me
        if (req.url === '/api/me') {
          if (devLoggedInUser) {
            res.end(JSON.stringify({ user: devLoggedInUser }));
          } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ message: 'Unauthorized' }));
          }
          return;
        }

        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiMockPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
