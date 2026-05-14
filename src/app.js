import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { helmetConfig } from './configs/helmet.config.js';
import { corsConfig } from './configs/cors.config.js';
import { limiter } from './configs/rate-limit.config.js';

const app = express();

// Security
app.use(helmet(helmetConfig));
app.use(cors(corsConfig));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);


// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;
