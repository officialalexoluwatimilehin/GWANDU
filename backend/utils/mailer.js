const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ from, to, subject, html }) {
    const { data, error } = await resend.emails.send({
        from: from || process.env.EMAIL_FROM,
        to: [to],
        subject,
        html
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error(error.message || "Email sending failed");
    }

    console.log("Email sent successfully:", data);

    return data;
}

module.exports = {
    sendMail
};