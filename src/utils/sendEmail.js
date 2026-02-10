// src/utils/sendEmail.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, text }) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM, // Finance Tracker <onboarding@resend.dev>
      to,
      subject,
      text,
    });

    console.log("📧 Email sent successfully:", response.id);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    throw err;
  }
};

module.exports = sendEmail;
