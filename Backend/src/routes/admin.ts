import { Router } from 'express';
import { db } from '../db';
import { complaints, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAuth, requireAdmin } from './auth';

export const adminRouter = Router();

adminRouter.get('/complaints', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const allComplaints = await db.select({
      id: complaints.id,
      complaintText: complaints.complaintText,
      aiQuestion: complaints.aiQuestion,
      userAnswer: complaints.userAnswer,
      createdAt: complaints.createdAt,
      user: {
        name: users.name,
        email: users.email
      }
    }).from(complaints).innerJoin(users, eq(complaints.userId, users.id)).orderBy(desc(complaints.createdAt));
    
    res.json(allComplaints);
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ error: 'Failed to fetch all complaints' });
  }
});
