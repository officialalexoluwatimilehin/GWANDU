const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

async function sendOTP(email, otp) {

    await transporter.sendMail({

        from: `"GWANDU Support" <${process.env.EMAIL_USER}>`,

        to: email,

        subject: "Verify your GWANDU account",

        html: `

        <div style="font-family:Arial,sans-serif;padding:20px">

            <h2>Welcome to GWANDU</h2>

            <p>Your verification code is:</p>

            <h1 style="letter-spacing:5px;color:#0d47a1;">${otp}</h1>

            <p>This code expires in 5 minutes.</p>

            <hr>

            <small>
            If you did not create this account, please ignore this email.
            </small>

        </div>

        `

    });

}

module.exports = sendOTP;