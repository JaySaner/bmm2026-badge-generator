import express from 'express';
import { createServer as createViteServer } from 'vite';
import apiApp from './api/index.js';

async function createServer() {
  const app = express();

  // Mount the API
  app.use(apiApp);

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
