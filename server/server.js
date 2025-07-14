// server/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cron from 'node-cron';

import protectedRoutes from './routes/protected.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import contentRoutes from './routes/content.js';
import eventsRouter from './routes/events.js';
import adminRoutes from './routes/admin.js';
import logRoutes from './routes/log.js';
import committeeRoutes from './routes/committee.js';
import adminCommitteeRoutes from './routes/adminCommittee.js';
import { snapshotCommittees } from './controllers/committeeController.js';

dotenv.config();

// __dirname equivalent for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/admin/committees', adminCommitteeRoutes);
app.use('/api/events', eventsRouter);
app.use('/api/log', logRoutes);
app.use('/api/protected', protectedRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('IRC API running.');
});

// Snapshot job
cron.schedule('0 0 1 1,7 *', snapshotCommittees);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 IRC backend running on port ${PORT}`);
});
