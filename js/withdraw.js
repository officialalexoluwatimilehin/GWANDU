const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

async function loadWithdrawalPage() {

    try {

        const res = await fetch(API_URL + "/me", {

            headers: {
                Authorization: "Bearer " + token
            }

        });

        const user = await res.json();

        if (!res.ok) {

            alert(user.error);

            return;

        }
        document.getElementById("mainBalance").innerText =
"$" + (user.balance || 0);

        document.getElementById("referralBalance").innerText =
            "$" + (user.referralBalance || 0);

        document.getElementById("investmentBalance").innerText =
            "$" + (user.availableProfit || 0);

        if (user.investmentStatus === "Active") {

            document.getElementById("lockMessage").innerText =
                "Investment locked until 30-day maturity.";

        }

        if (user.investmentStatus === "Completed") {

            document.getElementById("lockMessage").innerText =
                "Investment has matured. Withdrawal available.";

        }

    } catch (err) {

        console.error(err);

        alert("Unable to load withdrawal page.");

    }

}

document.getElementById("withdrawBtn").addEventListener("click", async () => {

    const withdrawType =
        document.getElementById("withdrawType").value;

    const network =
        document.getElementById("network").value;

    const wallet =
        document.getElementById("wallet").value.trim();

    const amount =
        Number(document.getElementById("amount").value);

    if (!wallet || !amount) {

        alert("Please complete every field.");

        return;

    }

    try {

        const res = await fetch(API_URL + "/withdraw", {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                Authorization: "Bearer " + token

            },

            body: JSON.stringify({

                type: withdrawType,

                network,

                wallet,

                amount

            })

        });

        const data = await res.json();

        if (!res.ok) {

            alert(data.error);

            return;

        }

        alert(data.message);

        window.location.href = "dashboard.html";

    }

    catch (err) {

        console.error(err);

        alert("Server error.");

    }

});

loadWithdrawalPage();