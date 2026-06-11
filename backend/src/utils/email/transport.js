const nodemailer = require("nodemailer");

// Isolated transport layer — swap this file to move to SES / SendGrid / Mailgun
// without touching emailService.js or any business logic.
// Lazy singleton: created on first use so env vars are always loaded by then.
let _transport = null;

const getTransport = () => {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transport;
};

module.exports = { sendMail: (...args) => getTransport().sendMail(...args) };
