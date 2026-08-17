document.getElementById("forgotForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message");

    message.innerText = "Sending reset link...";

    try {

        const res = await fetch(API_URL + "/forgot-password", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email
            })

        });

        const data = await res.json();

        if (!res.ok) {

            message.innerText =
                data.error || "Unable to process request.";

            return;
        }

        message.innerText =
            data.message || "Password reset link sent.";

    } catch (err) {

        console.error(err);

        message.innerText =
            "Unable to connect to the server.";

    }

});
