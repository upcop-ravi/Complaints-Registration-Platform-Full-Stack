import { Router } from 'express';
import { db } from '../db';
import { complaints, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './auth';

export const complaintsRouter = Router();

complaintsRouter.post('/', requireAuth, async (req: any, res: any) => {
  const { complaintText, aiQuestion, userAnswer } = req.body;
  
  if (!complaintText) {
    return res.status(400).json({ error: 'Complaint text is required' });
  }

  try {
    const newComplaint = await db.insert(complaints).values({
      userId: req.user.id,
      complaintText,
      aiQuestion,
      userAnswer,
    }).returning();
    
    res.json(newComplaint[0]);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
});

complaintsRouter.get('/my', requireAuth, async (req: any, res: any) => {
  try {
    const myComplaints = await db.select().from(complaints).where(eq(complaints.userId, req.user.id)).orderBy(desc(complaints.createdAt));
    res.json(myComplaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});


