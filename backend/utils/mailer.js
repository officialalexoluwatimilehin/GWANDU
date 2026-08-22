const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

async function sendMail({ from, to, subject, html }) {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: "GWANDU",
                email: "officialgwandusupport@gmail.com"
            },
            to: [
                {
                    email: to
                }
            ],
            subject,
            htmlContent: html
        });

        console.log("Brevo email sent successfully:", result);

        return result;
    } catch (error) {
        console.error(
            "Brevo email error:",
            error?.body || error?.message || error
        );

        throw new Error(
            error?.message || "Email sending failed"
        );
    }
}

module.exports = {
    sendMail
};