import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import contentRoutes from './routes/content.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import committeeRoutes from './routes/committee.js'
import adminCommitteeRoutes from './routes/adminCommittee.js'
import { snapshotCommittees } from './controllers/committeeController.js'
import cron from 'node-cron'

// Needed for __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ enable cookie parsing
app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/committees', committeeRoutes)
app.use('/api/admin/committees', adminCommitteeRoutes)


// schedule cron‐based snapshots
cron.schedule('0 0 1 1,7 *', snapshotCommittees)

// Root placeholder
app.get('/', (req, res) => {
  res.send('IRC API running.');
});

app.listen(PORT, () => {
  console.log(`🚀 IRC backend running on port ${PORT}`);
});
