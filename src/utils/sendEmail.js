// src/utils/sendEmail.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, text }) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM, // MUST be onboarding@resend.dev
      to,
      subject,
      text,
    });

    console.log("📧 Resend email sent:", response);
  } catch (error) {
    console.error("❌ Resend email failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
