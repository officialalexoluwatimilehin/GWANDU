console.log("NEW REGISTER.JS LOADED");

const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

const registerForm = document.getElementById("registerForm");
const referralInput = document.getElementById("referralCode");
const message = document.getElementById("message");

if (ref && referralInput) {
    referralInput.value = ref;
}

if (!registerForm) {
    console.error("registerForm was not found.");
} else {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("fullname").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {

            if (message) {
                message.innerText = "Passwords do not match.";
            } else {
                alert("Passwords do not match.");
            }

            return;
        }

        if (message) {
            message.innerText = "Creating your account...";
        }

        try {

            const res = await fetch(API_URL + "/signup", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    username: name,

                    email: email,

                    password: password,

                    referralCode:
                        referralInput
                            ? referralInput.value
                            : ""

                })

            });

            const data = await res.json();

            console.log("Signup status:", res.status);
            console.log("Signup response:", data);

            if (!res.ok) {

                if (message) {
                    message.innerText =
                        data.error || "Registration failed.";
                }

                return;
            }

            if (data.requiresVerification) {

                localStorage.setItem(
                    "verifyEmail",
                    data.email
                );

                window.location.href = "verify.html";

                return;
            }

            window.location.href = "login.html";

        } catch (err) {

            console.error("Registration error:", err);

            if (message) {
                message.innerText =
                    "Unable to connect to the server.";
            }

        }

    });

}
