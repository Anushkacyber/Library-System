const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping:', subject);
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
};

const dueDateReminderEmail = (user, book, daysLeft, fine = 0) => ({
  to: user.email,
  subject: `Library Reminder: "${book.title}" ${daysLeft <= 0 ? 'OVERDUE' : 'Due Soon'}`,
  html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
    <h2 style="color:${daysLeft <= 0 ? '#ef4444' : '#f59e0b'}">Hello ${user.name},</h2>
    ${daysLeft <= 0 ? `<p>"${book.title}" is <strong>${Math.abs(daysLeft)} day(s) overdue</strong>. Fine: ₹${fine}</p>` 
    : `<p>"${book.title}" is due in <strong>${daysLeft} day(s)</strong>.</p>`}
    <p>Fine rate: ₹${process.env.FINE_PER_DAY || 5}/day for late returns.</p>
  </div>`
});

const welcomeEmail = (user) => ({
  to: user.email,
  subject: 'Welcome to LibraFlow!',
  html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
    <h2>Welcome, ${user.name}!</h2>
    <p>Your library account is ready. Student ID: <strong>${user.student_id}</strong></p>
  </div>`
});

module.exports = { sendEmail, dueDateReminderEmail, welcomeEmail };
