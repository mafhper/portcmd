import express from 'express';
import cors from 'cors';
import systemRoutes from './routes/system.routes.js';
import projectRoutes from './routes/projects.routes.js';
import reportsRoutes from './routes/reports.routes.js';
// Reports routes will be imported here after user update

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/system', systemRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/reports', reportsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/', (req, res) => {
    res.send('Port Cmd API is running. Visit the frontend application to interact.');
  });

  return app;
}
