const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ from, to, subject, html, text }) {
    try {
        const result = await resend.emails.send({
            from: from || "GWANDU <auth@gwandu.me>",
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            text
        });

        if (result.error) {
            console.error("❌ Resend API Error:", result.error);
            throw new Error(result.error.message || "Resend API failed");
        }

        console.log("✅ Resend email sent:", result.data);
        return result.data;
    } catch (error) {
        console.error("❌ Resend API Error:", error);
        throw error;
    }
}

module.exports = { sendMail };
