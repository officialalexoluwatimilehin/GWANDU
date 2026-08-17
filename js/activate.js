const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

async function loadUser() {

    const res = await fetch(API_URL + "/me", {

        headers: {
            Authorization: "Bearer " + token
        }

    });

    const user = await res.json();

    document.getElementById("balance").innerText =
        "$" + user.balance;

    const select = document.getElementById("plan");

    Array.from(select.options).forEach(option => {

        if (Number(option.value) > user.balance) {

            option.remove();

        }

    });

    if (select.options.length === 0) {

        document.getElementById("activateNow").disabled = true;

        document.getElementById("message").innerText =
            "Your balance is too low to activate any investment plan.";

    }

}
loadUser();

document.getElementById("activateNow").addEventListener("click", async () => {

    const amount = Number(document.getElementById("plan").value);

    try {

        const res = await fetch(API_URL + "/activate-plan", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                Authorization: "Bearer " + token

            },

            body: JSON.stringify({

                amount

            })

        });

        const data = await res.json();

        if (!res.ok) {

            document.getElementById("message").innerText =
                data.error;

            return;

        }

        alert("Investment Activated Successfully!");

        window.location.href = "dashboard.html";

    }

    catch (err) {

        document.getElementById("message").innerText =
            "Server error.";

    }

});