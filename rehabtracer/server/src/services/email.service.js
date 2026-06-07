import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'RehabTracer'}" <${process.env.FROM_EMAIL}>`,
    to, subject, html, text,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed: ${error.message}`);
    throw error;
  }
};

export const sendWelcomeEmail = (name, email) =>
  sendEmail({
    to: email,
    subject: 'Welcome to RehabTracer!',
    html: `<h2>Welcome, ${name}!</h2><p>Your RehabTracer account has been created successfully. Start your rehabilitation journey today.</p>`,
  });

export const sendAppointmentReminder = (name, email, date) =>
  sendEmail({
    to: email,
    subject: 'Appointment Reminder — RehabTracer',
    html: `<h2>Appointment Reminder</h2><p>Hi ${name}, you have an appointment scheduled for <strong>${new Date(date).toLocaleString()}</strong>.</p>`,
  });