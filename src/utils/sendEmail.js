// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    const userEmail = process.env.EMAIL_USER || process.env.ALERT_EMAIL;
    const rawPass = process.env.EMAIL_PASS || process.env.ALERT_EMAIL_PASSWORD || "";
    // Clean spaces from Google App Passwords if present
    const cleanPass = rawPass.replace(/\s+/g, "");

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: userEmail,
        pass: cleanPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to) {
      console.error("❌ Email skipped: recipient missing");
      return { success: false, error: "Recipient missing" };
    }

    const recipient = String(to).trim();
    const senderEmail = process.env.EMAIL_USER || process.env.ALERT_EMAIL;
    const mailer = getTransporter();

    const mailOptions = {
      from: `"FiscalFlow Alerts" <${senderEmail}>`,
      to: recipient,
      replyTo: senderEmail,
      subject: subject || "FiscalFlow Notification",
      text: text || "",
      ...(html ? { html } : {}),
      headers: {
        "X-Priority": "1 (Highest)",
        "X-MSMail-Priority": "High",
        "Importance": "High",
      },
    };

    const info = await mailer.sendMail(mailOptions);

    console.log("📧 Email sent successfully:", {
      to: recipient,
      accepted: info.accepted,
      messageId: info.messageId,
      response: info.response,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    };
  } catch (err) {
    // ❗ NEVER throw — budget logic should not break transaction processing
    console.error("❌ Email send failed:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendEmail;

