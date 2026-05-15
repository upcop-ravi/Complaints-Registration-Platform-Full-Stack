import { Router } from 'express';
import { generateFollowUpQuestion } from '../services/ai';
import { requireAuth } from './auth';

export const aiRouter = Router();

aiRouter.post('/question', requireAuth, async (req: any, res: any) => {
  const { complaintText } = req.body;
  if (!complaintText) {
    return res.status(400).json({ error: 'Complaint text is required' });
  }

  const aiQuestion = await generateFollowUpQuestion(complaintText);
  res.json({ aiQuestion });
});
