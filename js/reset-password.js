const params =
    new URLSearchParams(window.location.search);

const token = params.get("token");

document.getElementById("resetBtn").onclick = async () => {

    const password =
        document.getElementById("password").value;

    const res = await fetch(
        API_URL + "/reset-password",
        {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                token,

                password

            })

        }
    );

    const data = await res.json();

    document.getElementById("message").innerText =
        data.message || data.error;

    if (res.ok) {

        setTimeout(() => {

            window.location.href = "login.html";

        }, 1500);

    }

};