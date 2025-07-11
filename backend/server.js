import dotenv from 'dotenv';
dotenv.config({
  path: "./.env"
});
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import analysisRoutes from './src/routes/analysisRoutes.js';
import errorHandler from './src/middleware/errorHandler.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', analysisRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'PostureGuard AI Backend Server' });
});

// Error Handler
app.use(errorHandler);

// Start
app.listen(PORT, () => {
  console.log(`🚀 PostureGuard AI Backend running at http://localhost:${PORT}`);
});
