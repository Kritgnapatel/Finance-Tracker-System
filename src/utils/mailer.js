const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_EMAIL_PASSWORD,
  },
});

const sendBudgetAlert = async (userId, categoryId, month, year, spent, limit) => {
  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: process.env.ALERT_EMAIL, // demo: send to self
    subject: "⚠️ Budget Alert",
    text: `Budget exceeded for category ${categoryId} (${month}/${year}). Spent ${spent} of ${limit}.`,
  });
};

module.exports = { sendBudgetAlert };
