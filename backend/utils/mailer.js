const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
);

async function sendMail({ from, to, subject, html }) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
        name: "GWANDU",
        email: "officialgwandusupport@gmail.com"
    };

    sendSmtpEmail.to = [
        {
            email: to
        }
    ];

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log("Brevo email sent successfully:", result);

        return result;
    } catch (error) {
        console.error(
            "Brevo email error:",
            error.response?.body || error.message || error
        );

        throw new Error("Email sending failed");
    }
}

module.exports = {
    sendMail
};