import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOTP = async (to: string, otp: string) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your OTP for Complaint Registration Platform',
    text: `Your One-Time Password is: ${otp}\n\nIt will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};
