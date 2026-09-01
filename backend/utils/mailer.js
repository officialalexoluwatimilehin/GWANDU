const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000
});

module.exports = transporter;
