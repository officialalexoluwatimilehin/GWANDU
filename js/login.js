document.getElementById("loginForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");
    const button = document.querySelector(".login-btn");

    message.innerText = "Logging in...";

    button.disabled = true;

    try {

        const res = await fetch(API_URL + "/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await res.json();

        console.log("Login response:", data);

        if (!res.ok) {

            if (data.requiresVerification) {

                localStorage.setItem(
                    "verifyEmail",
                    data.email
                );

                window.location.href = "verify.html";

                return;
            }

            message.innerText =
                data.error || "Invalid email or password.";

            button.disabled = false;

            return;
        }

        localStorage.setItem("token", data.token);

        console.log(
            "Token saved:",
            localStorage.getItem("token")
        );

        message.innerText = "Login successful.";

        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 500);

    } catch (err) {

        console.error("Login error:", err);

        message.innerText =
            "Unable to connect to the server.";

        button.disabled = false;
    }

});
