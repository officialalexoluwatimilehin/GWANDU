const token = localStorage.getItem("adminToken");

if (!token) {

    location.href = "login.html";

}

async function loadDashboard() {

    const res = await fetch(

        API_URL + "/admin/dashboard",

        {

            headers: {

                Authorization:
                    "Bearer " + token

            }

        }

    );

    const data = await res.json();

    document.getElementById("users").innerText =
        data.totalUsers;

    document.getElementById("deposits").innerText =
        "$" + data.totalDeposits;

    document.getElementById("investments").innerText =
        "$" + data.totalInvestments;

    document.getElementById("balance").innerText =
        "$" + data.totalBalance;

}

loadDashboard();