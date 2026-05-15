import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
  otp: text('otp'),
  otpExpiry: timestamp('otp_expiry'),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  complaintText: text('complaint_text').notNull(),
  aiQuestion: text('ai_question'),
  userAnswer: text('user_answer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
