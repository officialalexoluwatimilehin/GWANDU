const email = localStorage.getItem("verifyEmail");

const form = document.getElementById("verifyForm");
const otpInput = document.getElementById("otp");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const message = document.getElementById("message");

if (!email) {
    message.innerText =
        "Verification session not found. Please register again.";
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const otp = otpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {

        message.innerText =
            "Please enter the 6-digit verification code.";

        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML =
        "Verifying...";

    try {

        const res = await fetch(
            API_URL + "/verify-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    otp
                })
            }
        );

        const data = await res.json();

        if (!res.ok) {

            message.innerText =
                data.error || "Verification failed.";

            return;
        }

        if (!data.token) {

            message.innerText =
                "Verification succeeded but no login token was returned.";

            return;
        }

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.removeItem(
            "verifyEmail"
        );

        message.innerText =
            "Email verified successfully. Redirecting...";

        window.location.href =
            "dashboard.html";

    } catch (err) {

        console.error(err);

        message.innerText =
            "Unable to connect to the server.";

    } finally {

        verifyBtn.disabled = false;

        verifyBtn.innerHTML =
            'Verify Email <i class="fa-solid fa-arrow-right"></i>';
    }
});

resendBtn.addEventListener("click", async () => {

    if (!email) return;

    resendBtn.disabled = true;

    message.innerText =
        "Sending a new verification code...";

    try {

        const res = await fetch(
            API_URL + "/resend-otp",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email
                })
            }
        );

        const data = await res.json();

        message.innerText =
            data.message ||
            data.error ||
            "Unable to resend code.";

    } catch (err) {

        console.error(err);

        message.innerText =
            "Unable to connect to the server.";

    } finally {

        resendBtn.disabled = false;
    }
});
