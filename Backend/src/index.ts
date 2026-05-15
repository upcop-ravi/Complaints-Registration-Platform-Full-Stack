import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { complaintsRouter } from './routes/complaints';
import { aiRouter } from './routes/ai';

import { adminRouter } from './routes/admin';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: true, // Allow all origins for testing, or set specific origin
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ai', aiRouter);

app.get('/', (req, res) => {
  res.send('Complaint Registration API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
